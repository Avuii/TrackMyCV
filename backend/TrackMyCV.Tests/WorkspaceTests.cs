using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.Ai;
using TrackMyCV.Api.Controllers;
using TrackMyCV.Application.Applications.DTOs;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Domain.Enums;
using TrackMyCV.Infrastructure.Data;
using TrackMyCV.Infrastructure.Repositories;
using Xunit;

namespace TrackMyCV.Tests;

public sealed class WorkspaceTests : IAsyncLifetime
{

    private AppDbContext _db = null!;
    private readonly AppUser _owner = new() { Email = "owner@example.test", DisplayName = "Owner" };
    private readonly AppUser _other = new() { Email = "other@example.test", DisplayName = "Other" };

    public async Task InitializeAsync()
    {
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        await _db.Database.EnsureCreatedAsync();
        _db.AddRange(_owner, _other);
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task WorkspaceRequiresOwnerAndRejectsStaleWrites()
    {
        var controller = new WorkspaceController(_db);
        Assert.IsType<UnauthorizedResult>(await controller.WithUser(null)
            .Get("notes", default));
        controller.WithUser(_owner.Id);
        var payload = JsonSerializer.SerializeToElement(new[] { new { id = 1, body = "Private note" } });
        var created = Assert.IsType<OkObjectResult>(await controller.Put("notes", new(null, payload), default));
        var saved = Assert.IsType<WorkspaceController.Snapshot>(created.Value);
        Assert.NotNull(saved.Revision);

        controller.WithUser(_other.Id);
        var other = Assert.IsType<OkObjectResult>(await controller.Get("notes", default));
        Assert.Null(Assert.IsType<WorkspaceController.Snapshot>(other.Value).Data);

        controller.WithUser(_owner.Id);
        var updated = JsonSerializer.SerializeToElement(Array.Empty<object>());
        Assert.IsType<ConflictObjectResult>(await controller.Put("notes", new(null, updated), default));
        Assert.IsType<OkObjectResult>(await controller.Put("notes", new(saved.Revision, updated), default));
    }

    [Fact]
    public async Task ApplicationCanOnlyLinkToAnOwnedDocument()
    {
        var file = new UserDocument { AppUserId = _owner.Id, Name = "CV version", Type = "CV" };
        _db.Add(file);
        await _db.SaveChangesAsync();
        var controller = new JobApplicationsController(new JobApplicationRepository(_db), _db);
        var payload = new CreateJobApplicationDto
        {
            CompanyName = "Example", Position = "Developer", DateApplied = new DateOnly(2026, 10, 1), DocumentId = file.Id
        };
        var rejected = await controller.WithUser(_other.Id).Create(payload);
        Assert.IsType<BadRequestObjectResult>(rejected.Result);

        var accepted = await controller.WithUser(_owner.Id).Create(payload);
        var created = Assert.IsType<CreatedAtActionResult>(accepted.Result);
        var application = Assert.IsType<JobApplicationDto>(created.Value);
        Assert.Equal(file.Id, application.DocumentId);
        Assert.Equal(file.Name, application.CvName);
        Assert.IsType<NotFoundResult>((await controller.WithUser(_other.Id).GetById(application.Id)).Result);
    }

    [Fact]
    public async Task PreparationUsesTheOwnersApplicationAndOnlySendsOfferContext()
    {
        var application = new JobApplication
        {
            AppUserId = _owner.Id, CompanyName = "Example", Position = "Developer",
            Requirements = "C# and SQL", Notes = "Private notes",
            Status = ApplicationStatus.Interview
        };
        _db.Add(application);
        await _db.SaveChangesAsync();
        var provider = new PreparationProvider();
        var controller = new PreparationController(_db, provider);

        var request = new PreparationController.PreparationRequest(null, "pl");
        Assert.IsType<UnauthorizedResult>((await controller.WithUser(null).Generate(application.Id, request, default)).Result);
        Assert.IsType<NotFoundResult>((await controller.WithUser(_other.Id).Generate(application.Id, request, default)).Result);
        Assert.Null(provider.Context);

        var response = Assert.IsType<OkObjectResult>((await controller.WithUser(_owner.Id)
            .Generate(application.Id, request, default)).Result);
        var result = Assert.IsType<PreparationController.PreparationResult>(response.Value);
        Assert.Equal(new[] { "How would you optimize a SQL query?" }, result.Questions);
        Assert.Contains("Polish", provider.Instructions);
        Assert.Contains("C# and SQL", provider.Context);
        Assert.Contains("Interview", provider.Context);
        Assert.DoesNotContain(application.Notes, provider.Context);
    }

    private sealed class PreparationProvider : IAiProvider
    {
        public string? Instructions { get; private set; }
        public string? Context { get; private set; }

        public Task<TResponse> GenerateStructuredResponseAsync<TResponse>(
            string systemPrompt, string userPrompt, CancellationToken cancellationToken)
        {
            Instructions = systemPrompt;
            Context = userPrompt;
            return Task.FromResult((TResponse)(object)new PreparationController.PreparationResult(
                "Developer role requiring SQL.", [" How would you optimize a SQL query? ", "How would you optimize a SQL query?"],
                ["Review query plans."]));
        }
    }

    [Fact]
    public async Task FollowUpReadReceiptBelongsToTheCurrentAccount()
    {
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        _db.JobApplications.Add(new JobApplication
        {
            AppUserId = _owner.Id, CompanyName = "Example", Position = "Developer",
            DateApplied = date.AddDays(-8), Status = ApplicationStatus.Applied
        });
        await _db.SaveChangesAsync();
        var inbox = new InboxController(_db).WithUser(_owner.Id);
        var notices = ReadInbox(await inbox.Get(date, new TimeOnly(12, 0), default));
        var notice = Assert.Single(notices.EnumerateArray());
        Assert.False(notice.GetProperty("read").GetBoolean());
        Assert.IsType<NoContentResult>(await inbox.Read(notice.GetProperty("id").GetString()!, default));
        var updated = ReadInbox(await inbox.Get(date, new TimeOnly(12, 0), default));
        Assert.True(Assert.Single(updated.EnumerateArray()).GetProperty("read").GetBoolean());
        Assert.Empty(ReadInbox(await inbox.WithUser(_other.Id).Get(date, new TimeOnly(12, 0), default)).EnumerateArray());
    }

    [Fact]
    public async Task RegistrationAndLoginCreateDatabaseSessions()
    {
        var auth = new AuthController(_db).WithUser(null);
        const string email = "new-user@example.test";
        const string password = "Example-Password42!";
        Assert.IsType<OkObjectResult>((await auth.Register(new(email, password, "New user"))).Result);
        Assert.IsType<UnauthorizedObjectResult>((await auth.Login(new(email, "Incorrect-Password42!"))).Result);
        Assert.IsType<OkObjectResult>((await auth.Login(new(email, password))).Result);
        Assert.Equal(2, await _db.AuthSessions.CountAsync());
    }

    [Fact]
    public void SqlServerMigrationsMatchTheCurrentModel()
    {
        using var sql = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost;Database=TrackMyCV;Integrated Security=true").Options);
        Assert.False(sql.Database.HasPendingModelChanges());
        var script = sql.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        Assert.Contains("CREATE TABLE [WorkspaceSections]", script);
        Assert.Contains("FK_JobApplications_UserDocuments_DocumentId", script);
        Assert.Contains("CREATE TABLE [ApplicationActivities]", script);
    }

    private static JsonElement ReadInbox(IActionResult result) =>
        JsonSerializer.SerializeToElement(Assert.IsType<OkObjectResult>(result).Value, new JsonSerializerOptions(JsonSerializerDefaults.Web));

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();

    }
}

internal static class ControllerTestContext
{
    public static T WithUser<T>(this T controller, Guid? userId) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        if (userId is Guid id)
            controller.HttpContext.Items[AuthHttpContextExtensions.UserIdItemKey] = id;
        return controller;
    }
}
