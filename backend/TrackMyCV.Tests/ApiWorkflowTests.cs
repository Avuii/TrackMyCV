using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using TrackMyCV.Api.Ai;
using TrackMyCV.Api.Controllers;
using TrackMyCV.Api.JobScout;
using TrackMyCV.Api.Notifications;
using TrackMyCV.Application.Applications.DTOs;
using TrackMyCV.Domain.Enums;
using TrackMyCV.Infrastructure.Data;
using Xunit;

namespace TrackMyCV.Tests;

public sealed class ApiWorkflowTests : IAsyncLifetime
{
    private const string Password = "Test-Password42!";
    private const string CvText = "I build and maintain SQL queries, .NET web applications and automated integration tests. I have worked with product teams to improve the reliability of reporting and data imports.";
    private readonly TestApi _api = new();

    [Fact]
    public async Task AuthenticationIssuesAndRevokesARealBearerSession()
    {
        using var client = _api.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);

        var registered = await Register(client, "owner");
        Assert.Equal(registered.User.Id, (await client.GetFromJsonAsync<AuthUserDto>("/api/auth/me"))!.Id);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/auth/login", new { email = registered.User.Email, password = "Wrong-Password42!" })).StatusCode);

        using var secondDevice = _api.CreateClient();
        var login = await Read<AuthResponse>(await secondDevice.PostAsJsonAsync("/api/auth/login", new { email = registered.User.Email, password = Password }));
        Assert.Equal(registered.User.Id, login.User.Id);
        Assert.NotEqual(registered.Token, login.Token);
        secondDevice.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);

        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await secondDevice.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task ApplicationCrudIsScopedToTheOwner()
    {
        using var owner = await SignedInClient("owner");
        using var other = await SignedInClient("other");
        var created = await CreateApplication(owner);
        var path = $"/api/applications/{created.Id}";
        Assert.Equal(created.Id, Assert.Single((await owner.GetFromJsonAsync<JobApplicationDto[]>("/api/applications"))!).Id);
        Assert.Empty((await other.GetFromJsonAsync<JobApplicationDto[]>("/api/applications"))!);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync(path)).StatusCode);

        var update = new UpdateJobApplicationDto
        {
            CompanyName = created.CompanyName, Position = "Senior Developer", DateApplied = created.DateApplied,
            Status = ApplicationStatus.Interview, WorkMode = WorkMode.Hybrid
        };
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync(path, update)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.PutAsJsonAsync(path, update)).StatusCode);
        var edited = await owner.GetFromJsonAsync<JobApplicationDto>(path);
        Assert.Equal(update.Position, edited!.Position);
        Assert.Equal(ApplicationStatus.Interview, edited.Status);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task DocumentUploadValidatesTypeAndProtectsDownloadedBytes()
    {
        using var owner = await SignedInClient("owner");
        using var other = await SignedInClient("other");
        using var invalid = CvForm("resume.exe");
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsync("/api/documents/upload", invalid)).StatusCode);

        var document = await UploadCv(owner);
        var download = $"/api/documents/{document.Id}/download";
        Assert.Equal(CvText, await owner.GetStringAsync(download));
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync(download)).StatusCode);
        Assert.Empty((await other.GetFromJsonAsync<DocumentDto[]>("/api/documents"))!);

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/documents/{document.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(download)).StatusCode);
        Assert.Empty(Directory.EnumerateFiles(_api.UploadRoot, "*", SearchOption.AllDirectories));
    }

    [Fact]
    public async Task CalendarChangesSyncAcrossSessionsAndRemainPrivate()
    {
        using var owner = _api.CreateClient();
        var account = await Register(owner, "owner");
        using var secondDevice = _api.CreateClient();
        var login = await Read<AuthResponse>(await secondDevice.PostAsJsonAsync("/api/auth/login",
            new { email = account.User.Email, password = Password }));
        secondDevice.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        using var other = await SignedInClient("other");

        var job = await CreateApplication(owner);
        var entry = Deadline(job.Id);
        const string path = "/api/calendar-events";
        Assert.Equal(HttpStatusCode.BadRequest, (await other.PostAsJsonAsync(path, entry)).StatusCode);
        await Read<CalendarEventDto>(await owner.PostAsJsonAsync(path, entry));
        await Read<CalendarEventDto>(await owner.PostAsJsonAsync(path, entry));
        var received = Assert.Single((await secondDevice.GetFromJsonAsync<CalendarEventDto[]>(path))!);
        Assert.Equal(job.Id.ToString(), received.ApplicationId);
        Assert.Empty((await other.GetFromJsonAsync<CalendarEventDto[]>(path))!);

        var changed = entry with { StartTime = new TimeOnly(11, 30) };
        var itemPath = $"{path}/{entry.ClientEventId}";
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync(itemPath, changed)).StatusCode);
        await Read<CalendarEventDto>(await secondDevice.PutAsJsonAsync(itemPath, changed));
        Assert.Equal(changed.StartTime, Assert.Single((await owner.GetFromJsonAsync<CalendarEventDto[]>(path))!).StartTime);
        Assert.Equal(HttpStatusCode.NoContent, (await secondDevice.DeleteAsync(itemPath)).StatusCode);
        Assert.Empty((await owner.GetFromJsonAsync<CalendarEventDto[]>(path))!);
    }

    [Fact]
    public async Task DeadlineReminderRespectsTheOffsetRetriesFailureAndDeduplicatesSuccess()
    {
        using var client = await SignedInClient("owner");
        var settings = new NotificationSettingsRequest("owner@example.test", false, false, true, false, false, "1 hour before");
        await Read<NotificationSettingsDto>(await client.PutAsJsonAsync("/api/notifications/settings", settings));
        await Read<CalendarEventDto>(await client.PostAsJsonAsync("/api/calendar-events", Deadline(Guid.Empty)));

        using var worker = ActivatorUtilities.CreateInstance<NotificationBackgroundService>(_api.Services);
        _api.Clock.Now = new DateTimeOffset(2026, 11, 12, 8, 59, 0, TimeSpan.Zero);
        await worker.ScanAsync(default);
        Assert.Empty(_api.Email.Attempts);

        _api.Clock.Now = _api.Clock.Now.AddMinutes(1);
        _api.Email.FailNext = true;
        await worker.ScanAsync(default);
        await worker.ScanAsync(default);
        await worker.ScanAsync(default);

        Assert.Equal(2, _api.Email.Attempts.Count);
        Assert.All(_api.Email.Attempts, attempt => Assert.Equal(("owner@example.test", "Reminder: Application deadline"), attempt));
        using var scope = _api.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var sent = await db.NotificationEmailLogs.SingleAsync();
        Assert.Equal("deadline-1:deadline", sent.NotificationKey);
    }

    [Fact]
    public async Task WorkspaceLinksAndHistorySurviveReloadAndStayPrivate()
    {
        using var owner = await SignedInClient("owner");
        using var other = await SignedInClient("other");
        var cv = await UploadCv(owner);
        const long companyId = 1_800_000_000_123;
        var job = await Read<JobApplicationDto>(await owner.PostAsJsonAsync("/api/applications", new CreateJobApplicationDto
        {
            WorkspaceCompanyId = companyId, DocumentId = cv.Id, CompanyName = "Example",
            Position = "Developer", DateApplied = new DateOnly(2026, 11, 11)
        }));
        await Read<JsonElement>(await owner.PutAsJsonAsync("/api/workspace/companies",
            new { data = new[] { new { id = companyId, name = "Example" } } }));
        const string attachment = "data:text/plain;base64,Y3Y=";
        await Read<JsonElement>(await owner.PutAsJsonAsync("/api/workspace/notes", new
        {
            data = new[] { new { id = 1, applicationId = job.Id, attachments = new[] { new { id = 1, dataUrl = attachment } } } }
        }));

        using var secondDevice = _api.CreateClient();
        var login = await Read<AuthResponse>(await secondDevice.PostAsJsonAsync("/api/auth/login",
            new { email = "owner@example.test", password = Password }));
        secondDevice.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        var applicationPath = $"/api/applications/{job.Id}";
        var reloaded = await secondDevice.GetFromJsonAsync<JobApplicationDto>(applicationPath);
        Assert.Equal(companyId, reloaded!.WorkspaceCompanyId);
        Assert.Equal(cv.Id, reloaded.DocumentId);
        var notes = await secondDevice.GetFromJsonAsync<JsonElement>("/api/workspace/notes");
        Assert.Equal(job.Id, notes.GetProperty("data")[0].GetProperty("applicationId").GetGuid());
        Assert.Equal(attachment, notes.GetProperty("data")[0].GetProperty("attachments")[0].GetProperty("dataUrl").GetString());
        Assert.Equal(JsonValueKind.Null, (await other.GetFromJsonAsync<JsonElement>("/api/workspace/notes")).GetProperty("data").ValueKind);

        var update = new UpdateJobApplicationDto
        {
            WorkspaceCompanyId = companyId, CompanyName = job.CompanyName, Position = job.Position, DateApplied = job.DateApplied,
            Status = ApplicationStatus.Interview, NextStep = "Prepare examples"
        };
        Assert.Equal(HttpStatusCode.NoContent, (await secondDevice.PutAsJsonAsync(applicationPath, update)).StatusCode);
        var timeline = await owner.GetFromJsonAsync<JsonElement>($"{applicationPath}/activity");
        Assert.Equal(4, timeline.GetProperty("activity").GetArrayLength());
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"{applicationPath}/activity")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync(applicationPath)).StatusCode);

        var usagePath = $"/api/documents/{cv.Id}/usage";
        var usage = await secondDevice.GetFromJsonAsync<JsonElement[]>(usagePath);
        Assert.Equal(new[] { "document-unlinked", "document-linked" }, usage!.Select(entry => entry.GetProperty("kind").GetString()));
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync(usagePath)).StatusCode);
    }

    [Fact]
    public async Task FollowUpUsesTheSyncedIntervalForInboxAndEmail()
    {
        using var owner = await SignedInClient("owner");
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var job = await Read<JobApplicationDto>(await owner.PostAsJsonAsync("/api/applications", new CreateJobApplicationDto
        {
            CompanyName = "Example", Position = "Developer", DateApplied = date.AddDays(-4),
            LastContact = date.AddDays(-2), Status = ApplicationStatus.Applied
        }));
        await Read<JsonElement>(await owner.PutAsJsonAsync("/api/workspace/preferences", new { data = new { followUpDays = 3 } }));
        var settings = new NotificationSettingsRequest("owner@example.test", false, true, false, false, false, "15 minutes before");
        await Read<NotificationSettingsDto>(await owner.PutAsJsonAsync("/api/notifications/settings", settings));
        _api.Clock.Now = new DateTimeOffset(date.ToDateTime(new TimeOnly(9, 0)), TimeSpan.Zero);
        using var worker = ActivatorUtilities.CreateInstance<NotificationBackgroundService>(_api.Services);

        Assert.Empty((await owner.GetFromJsonAsync<JsonElement[]>($"/api/inbox?today={date:yyyy-MM-dd}&time=09:00"))!);
        await worker.ScanAsync(default);
        Assert.Empty(_api.Email.Attempts);

        _api.Clock.Now = _api.Clock.Now.AddDays(1);
        var due = date.AddDays(1);
        var notice = Assert.Single((await owner.GetFromJsonAsync<JsonElement[]>($"/api/inbox?today={due:yyyy-MM-dd}&time=09:00"))!);
        Assert.Equal(job.Id, notice.GetProperty("applicationId").GetGuid());
        await worker.ScanAsync(default);
        await worker.ScanAsync(default);
        Assert.Equal(("owner@example.test", "Follow up: Example"), Assert.Single(_api.Email.Attempts));
    }

    [Fact]
    public async Task JobScoutPersistsDecisionsAndNotifiesOnlyForNewScheduledMatches()
    {
        using var owner = await SignedInClient("owner");
        using var other = await SignedInClient("other");
        _api.Clock.Now = new DateTimeOffset(2026, 11, 12, 8, 0, 0, TimeSpan.Zero);
        await Read<JobApplicationDto>(await owner.PostAsJsonAsync("/api/applications", new CreateJobApplicationDto
        {
            CompanyName = "Different display name", Position = "Tracked role",
            OfferUrl = "https://arbeitnow.com/jobs/tracked/?utm_source=example", DateApplied = new DateOnly(2026, 11, 11)
        }));

        var legacy = new ScoutMatch("legacy", "Junior .NET Legacy", "Example", "Warsaw", "Remote",
            _api.Clock.Now, _api.Clock.Now, "Arbeitnow Europe", "https://arbeitnow.com/jobs/legacy",
            "https://arbeitnow.com/jobs/legacy", 95, "Legacy match", [".NET"], [], "saved");
        using (var scope = _api.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.AppUsers.SingleAsync(item => item.Email == "owner@example.test");
            db.WorkspaceSections.Add(new TrackMyCV.Domain.Entities.WorkspaceSection
            {
                AppUserId = user.Id, Name = "scout", Revision = Guid.NewGuid(),
                Json = JsonSerializer.Serialize(new ScoutHistory([legacy], []), new JsonSerializerOptions(JsonSerializerDefaults.Web))
            });
            await db.SaveChangesAsync();
        }

        var prefs = new ScoutPreferences([".NET"], ["Junior"], ["Warsaw"], ["Remote"], 90);
        await Read<JsonElement>(await owner.PutAsJsonAsync("/api/workspace/preferences", new { data = prefs }));
        var manual = await Read<ScoutSearchResult>(await owner.PostAsJsonAsync("/api/job-scout/search", prefs));
        Assert.Equal(2, manual.Run.NewMatches);
        var save = Assert.Single(manual.State.Matches, match => match.Title == "Junior .NET Developer");
        var ignore = Assert.Single(manual.State.Matches, match => match.Title == "Junior .NET Intern");
        Assert.Contains(manual.State.Matches, match => match.Id == legacy.Id && match.Status == "saved");

        async Task<ScoutSnapshot> SetStatus(string id, string status) =>
            await Read<ScoutSnapshot>(await owner.PutAsJsonAsync("/api/job-scout/matches/status", new { id, status }));
        await SetStatus(save.Id, "saved");
        await SetStatus(ignore.Id, "ignored");
        Assert.Equal(HttpStatusCode.NotFound,
            (await other.PutAsJsonAsync("/api/job-scout/matches/status", new { id = save.Id, status = "ignored" })).StatusCode);
        var enabled = await Read<ScoutSnapshot>(await owner.PutAsJsonAsync("/api/job-scout/schedule",
            new { intervalHours = 6, minimumScore = 90 }));
        Assert.Equal(_api.Clock.Now.AddHours(6), enabled.Schedule.NextRunAt);

        using var worker = ActivatorUtilities.CreateInstance<JobScoutBackgroundService>(_api.Services);
        _api.ScoutFeed.IncludeScheduled = true;
        ((MemoryCache)_api.Services.GetRequiredService<IMemoryCache>()).Compact(1);
        await worker.ScanAsync(default);
        Assert.Single((await owner.GetFromJsonAsync<ScoutSnapshot>("/api/job-scout"))!.Runs);
        _api.Clock.Now = _api.Clock.Now.AddHours(6);
        await worker.ScanAsync(default);
        await worker.ScanAsync(default);

        using var secondDevice = _api.CreateClient();
        var login = await Read<AuthResponse>(await secondDevice.PostAsJsonAsync("/api/auth/login",
            new { email = "owner@example.test", password = Password }));
        secondDevice.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        var persisted = (await secondDevice.GetFromJsonAsync<ScoutSnapshot>("/api/job-scout"))!;
        Assert.Equal(2, persisted.Runs.Length);
        Assert.True(persisted.Runs[0].Scheduled);
        Assert.Equal(1, persisted.Runs[0].NewMatches);
        Assert.Equal(_api.Clock.Now.AddHours(6), persisted.Schedule.NextRunAt);
        Assert.Equal("saved", persisted.Matches.Single(match => match.Id == save.Id).Status);
        Assert.Equal("ignored", persisted.Matches.Single(match => match.Id == ignore.Id).Status);
        Assert.Equal("Junior .NET Engineer", Assert.Single(persisted.Matches, match => match.Status == "new").Title);
        Assert.Empty((await other.GetFromJsonAsync<ScoutSnapshot>("/api/job-scout"))!.Matches);

        var notice = Assert.Single((await secondDevice.GetFromJsonAsync<JsonElement[]>("/api/inbox"))!);
        Assert.Equal("ai", notice.GetProperty("page").GetString());
        Assert.False(notice.GetProperty("read").GetBoolean());
        var noticeId = notice.GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NoContent, (await secondDevice.PutAsync($"/api/inbox/{noticeId}/read", null)).StatusCode);
        Assert.True(Assert.Single((await owner.GetFromJsonAsync<JsonElement[]>("/api/inbox"))!).GetProperty("read").GetBoolean());
        Assert.Empty((await other.GetFromJsonAsync<JsonElement[]>("/api/inbox"))!);
        var disabled = await Read<ScoutSnapshot>(await owner.PutAsJsonAsync("/api/job-scout/schedule",
            new { intervalHours = 0, minimumScore = 90 }));
        Assert.Null(disabled.Schedule.NextRunAt);
    }

    [Fact]
    public async Task IdenticalFeedsDoNotTurnLowerRankedOffersIntoNewMatchesOnEveryRun()
    {
        using var owner = await SignedInClient("owner");
        _api.ScoutFeed.ExtraOffers = 110;
        var prefs = new ScoutPreferences([".NET"], [], [], [], 70);
        var first = await Read<ScoutSearchResult>(await owner.PostAsJsonAsync("/api/job-scout/search", prefs));
        var repeated = await Read<ScoutSearchResult>(await owner.PostAsJsonAsync("/api/job-scout/search", prefs));

        Assert.Equal(100, first.Run.NewMatches);
        Assert.Equal(0, repeated.Run.NewMatches);
        Assert.Equal(100, repeated.State.Matches.Length);
    }

    [Fact]
    public async Task ScoutRetriesFailedScheduledSearchWithoutSendingANotice()
    {
        using var owner = await SignedInClient("owner");
        _api.Clock.Now = new DateTimeOffset(2026, 11, 12, 8, 0, 0, TimeSpan.Zero);
        await Read<ScoutSnapshot>(await owner.PutAsJsonAsync("/api/job-scout/schedule",
            new { intervalHours = 6, minimumScore = 90 }));
        _api.Clock.Now = _api.Clock.Now.AddHours(6);
        _api.ScoutFeed.Unavailable = true;
        using var worker = ActivatorUtilities.CreateInstance<JobScoutBackgroundService>(_api.Services);
        await worker.ScanAsync(default);

        var failed = (await owner.GetFromJsonAsync<ScoutSnapshot>("/api/job-scout"))!;
        Assert.Equal("failed", Assert.Single(failed.Runs).Status);
        Assert.Equal(_api.Clock.Now.AddMinutes(30), failed.Schedule.NextRunAt);
        Assert.Empty((await owner.GetFromJsonAsync<JsonElement[]>("/api/inbox"))!);

        _api.ScoutFeed.Unavailable = false;
        _api.Clock.Now = _api.Clock.Now.AddMinutes(30);
        await worker.ScanAsync(default);
        var recovered = (await owner.GetFromJsonAsync<ScoutSnapshot>("/api/job-scout"))!;
        Assert.Equal(new[] { "completed", "failed" }, recovered.Runs.Select(run => run.Status));
        Assert.Equal(_api.Clock.Now.AddHours(6), recovered.Schedule.NextRunAt);
        Assert.Single((await owner.GetFromJsonAsync<JsonElement[]>("/api/inbox"))!);
    }

    [Fact]
    public async Task AiWorkflowsUseOwnedInputsAndPersistReviewHistory()
    {
        using var owner = await SignedInClient("owner");
        using var other = await SignedInClient("other");
        var cv = await UploadCv(owner);
        var job = await CreateApplication(owner);
        var reviewRequest = new CvReviewRequest(cv.Id, "job-match", "en", job.Position, "Mid", job.Requirements);
        const string reviews = "/api/ai/cv-reviews";
        Assert.Equal(HttpStatusCode.BadRequest, (await other.PostAsJsonAsync(reviews, reviewRequest)).StatusCode);

        _api.Ai.FailNext = true;
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await owner.PostAsJsonAsync(reviews, reviewRequest)).StatusCode);
        var failedReview = Assert.Single((await owner.GetFromJsonAsync<CvReviewDto[]>(reviews))!);
        Assert.Equal("Failed", failedReview.Status);
        var review = await Read<CvReviewDto>(await owner.PostAsJsonAsync(reviews, reviewRequest));
        Assert.Equal("Completed", review.Status);
        Assert.Equal(85, review.Result!.JobMatchScore);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"{reviews}/{review.Id}")).StatusCode);

        var preparation = await Read<PreparationController.PreparationResult>(await owner.PostAsJsonAsync(
            $"/api/ai/preparation/{job.Id}", new PreparationController.PreparationRequest(null, "en")));
        Assert.Equal("How do you tune a query?", Assert.Single(preparation.Questions));

        var candidate = new CoverLetterCandidateInfo("Test Applicant", "", "", "", "", "");
        var cover = await Read<CoverLetterGenerateResponse>(await owner.PostAsJsonAsync("/api/ai/cover-letters/generate",
            new CoverLetterGenerateRequest(cv.Id, job.CompanyName, job.Position, job.Requirements, "en", "natural", "short", null, candidate)));
        Assert.Contains("SQL", cover.CoverLetter);
        Assert.NotNull(cover.PdfBase64);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"{reviews}/{review.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"{reviews}/{review.Id}")).StatusCode);
    }

    private async Task<HttpClient> SignedInClient(string name)
    {
        var client = _api.CreateClient();
        await Register(client, name);
        return client;
    }

    private static async Task<AuthResponse> Register(HttpClient client, string name)
    {
        var auth = await Read<AuthResponse>(await client.PostAsJsonAsync("/api/auth/register",
            new { email = $"{name}@example.test", password = Password, displayName = name }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return auth;
    }

    private static async Task<JobApplicationDto> CreateApplication(HttpClient client) =>
        await Read<JobApplicationDto>(await client.PostAsJsonAsync("/api/applications", new CreateJobApplicationDto
        {
            CompanyName = "Example", Position = "Developer", Requirements = "Write SQL queries",
            DateApplied = new DateOnly(2026, 11, 11)
        }));

    private static CalendarEventRequest Deadline(Guid applicationId) =>
        new("deadline-1", "Application deadline", "Example", applicationId == Guid.Empty ? "" : applicationId.ToString(), "Application deadline",
            new DateOnly(2026, 11, 12), new TimeOnly(10, 0), null, "", "", "", "", "");

    private static MultipartFormDataContent CvForm(string fileName)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent("CV"), "type");
        form.Add(new StringContent(CvText, Encoding.UTF8, "text/plain"), "file", fileName);
        return form;
    }

    private static async Task<DocumentDto> UploadCv(HttpClient client)
    {
        using var form = CvForm("resume.txt");
        var response = await client.PostAsync("/api/documents/upload", form);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await Read<DocumentDto>(response);
    }

    private static async Task<T> Read<T>(HttpResponseMessage response)
    {
        using (response)
        {
            Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
            return (await response.Content.ReadFromJsonAsync<T>())!;
        }
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await _api.DisposeAsync();
        _api.Root.Delete(recursive: true);
    }

    private sealed class TestApi : WebApplicationFactory<Program>
    {
        public DirectoryInfo Root { get; } = Directory.CreateTempSubdirectory("trackmycv-test-");
        public string UploadRoot => Path.Combine(Root.FullName, "App_Data", "uploads");
        public TestClock Clock { get; } = new();
        public RecordingEmailSender Email { get; } = new();
        public TestAiProvider Ai { get; } = new();
        public ScoutFeedHandler ScoutFeed { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing").UseSetting("Database:ApplyMigrations", "false");
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(Root.Name));

                var worker = services.Single(service => service.ServiceType == typeof(IHostedService) &&
                    service.ImplementationType == typeof(NotificationBackgroundService));
                services.Remove(worker);
                var scoutWorker = services.Single(service => service.ServiceType == typeof(IHostedService) &&
                    service.ImplementationType == typeof(JobScoutBackgroundService));
                services.Remove(scoutWorker);
                services.AddHttpClient<JobScoutService>().ConfigurePrimaryHttpMessageHandler(() => ScoutFeed);
                services.RemoveAll<TimeProvider>();
                services.AddSingleton<TimeProvider>(Clock);
                services.RemoveAll<IEmailSender>();
                services.AddSingleton<IEmailSender>(Email);
                services.RemoveAll<IAiProvider>();
                services.AddSingleton<IAiProvider>(Ai);
                services.RemoveAll<ICoverLetterLatexRenderer>();
                services.AddSingleton<ICoverLetterLatexRenderer, TestPdfRenderer>();
            });
            builder.ConfigureServices((context, _) => context.HostingEnvironment.ContentRootPath = Root.FullName);
        }
    }

    private sealed class ScoutFeedHandler : HttpMessageHandler
    {
        public bool IncludeScheduled { get; set; }
        public bool Unavailable { get; set; }
        public int ExtraOffers { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (Unavailable)
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));

            var suffix = request.RequestUri!.Host.EndsWith(".co.uk", StringComparison.Ordinal) ? "-uk" : "";
            var data = new List<object>
            {
                Offer("developer" + suffix, " Junior  .NET Developer ", "developer"),
                Offer("intern" + suffix, "Junior .NET Intern", "intern"),
                Offer("tracked" + suffix, "Junior .NET Tracked", "tracked")
            };
            if (IncludeScheduled)
            {
                data.Add(Offer("engineer" + suffix, "Junior .NET Engineer", "engineer"));
                data.Add(Offer("devops" + suffix, "Junior DevOps Engineer", "devops"));
            }
            for (var index = 0; index < ExtraOffers; index++)
                data.Add(Offer($"extra-{index}{suffix}", $".NET Developer {index}", $"extra-{index}"));
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(new { data }) });
        }

        private static object Offer(string slug, string title, string path) => new
        {
            slug, title, company_name = "Example", location = "Warsaw", remote = true,
            url = $"https://www.arbeitnow.com/jobs/{path}", tags = Array.Empty<string>(), created_at = 1794450000
        };
    }

    private sealed class TestClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }
        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class RecordingEmailSender : IEmailSender
    {
        public bool IsConfigured => true;
        public bool FailNext { get; set; }
        public List<(string Recipient, string Subject)> Attempts { get; } = [];

        public Task<EmailSendResult> SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken)
        {
            Attempts.Add((recipientEmail, subject));
            var sent = !FailNext;
            FailNext = false;
            return Task.FromResult(new EmailSendResult(sent, ""));
        }
    }

    private sealed class TestAiProvider : IAiProvider
    {
        public bool FailNext { get; set; }

        public Task<T> GenerateStructuredResponseAsync<T>(string systemPrompt, string userPrompt, CancellationToken cancellationToken)
        {
            if (FailNext)
            {
                FailNext = false;
                throw new AiProviderException("The test provider is temporarily unavailable.");
            }

            var result = typeof(T) == typeof(CvReviewResult)
                ? """{"overallScore":80,"jobMatchScore":85,"summary":"SQL experience"}"""
                : typeof(T) == typeof(PreparationController.PreparationResult)
                    ? """{"summary":"SQL role","questions":["How do you tune a query?"],"suggestions":["Review query plans."]}"""
                    : """{"coverLetter":"I have experience writing SQL queries.","warnings":[]}""";
            return Task.FromResult(JsonSerializer.Deserialize<T>(result, new JsonSerializerOptions(JsonSerializerDefaults.Web))!);
        }
    }

    private sealed class TestPdfRenderer : ICoverLetterLatexRenderer
    {
        public Task<CoverLetterPdfRenderResult> RenderAsync(CoverLetterPdfRenderRequest request, CancellationToken cancellationToken) =>
            Task.FromResult(new CoverLetterPdfRenderResult("dGVzdCBwZGY=", "test source", []));
    }
}
