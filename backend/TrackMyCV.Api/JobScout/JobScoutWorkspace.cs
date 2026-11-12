using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.JobScout;

public record ScoutRun(Guid Id, DateTimeOffset StartedAt, DateTimeOffset CompletedAt, string Status,
    int NewMatches, string Message, bool Scheduled = false);
public record ScoutHistory(ScoutMatch[] Matches, ScoutRun[] Runs);
public record ScoutSchedule(int IntervalHours, int MinimumScore, DateTimeOffset? NextRunAt);
public record ScoutSnapshot(ScoutMatch[] Matches, ScoutRun[] Runs, ScoutSchedule Schedule);
public record ScoutSearchResult(ScoutSnapshot State, ScoutRun Run);

public sealed class JobScoutWorkspace(AppDbContext db, JobScoutService scout, TimeProvider clock)
{
    private const string HistoryName = "scout";
    internal const string ScheduleName = "scout-schedule";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly ScoutHistory EmptyHistory = new([], []);
    private static readonly ScoutSchedule DefaultSchedule = new(0, 70, null);

    public async Task<ScoutSnapshot> GetAsync(Guid userId, CancellationToken token)
    {
        var sections = await db.WorkspaceSections.AsNoTracking()
            .Where(item => item.AppUserId == userId && (item.Name == HistoryName || item.Name == ScheduleName))
            .ToDictionaryAsync(item => item.Name, token);
        var history = ReadHistory(sections.GetValueOrDefault(HistoryName));
        var tracked = await ReadTrackedAsync(userId, token);
        return Snapshot(history with { Matches = history.Matches.Where(match => match.Status != "new" || !tracked.Contains(match)).ToArray() },
            Deserialize(sections.GetValueOrDefault(ScheduleName), DefaultSchedule));
    }

    public Task<ScoutSnapshot?> SetScheduleAsync(Guid userId, int hours, int minimumScore, CancellationToken token) =>
        WriteAsync(userId, (_, schedule) =>
        {
            var next = hours == 0 ? null
                : hours == schedule.IntervalHours && schedule.NextRunAt.HasValue ? schedule.NextRunAt : clock.GetUtcNow().AddHours(hours);
            return (null, new ScoutSchedule(hours, minimumScore, next));
        }, token);

    public Task<ScoutSnapshot?> SetStatusAsync(Guid userId, string id, string status, CancellationToken token) =>
        WriteAsync(userId, (history, _) =>
        {
            var index = Array.FindIndex(history.Matches, match => match.Id == id);
            if (index < 0)
                return (null, null);
            history.Matches[index] = history.Matches[index] with { Status = status };
            return (history, null);
        }, token);

    public async Task<ScoutSearchResult?> SearchAsync(Guid userId, ScoutPreferences? manualPreferences, CancellationToken token)
    {
        var scheduled = manualPreferences is null;
        var started = clock.GetUtcNow();
        if (scheduled)
        {
            var schedule = Deserialize(await ReadSectionAsync(db, userId, ScheduleName, token), DefaultSchedule);
            if (schedule.NextRunAt is null || schedule.NextRunAt > started)
                return null;
        }
        var preferences = manualPreferences ?? await ReadPreferencesAsync(userId, token);
        var (offers, failed) = await scout.ReadFeeds(token);
        var tracked = await ReadTrackedAsync(userId, token);
        var completed = clock.GetUtcNow();
        var failedAll = failed.Length == JobScoutService.Sources.Length;
        var id = Guid.NewGuid();
        ScoutRun? run = null;

        var state = await WriteAsync(userId, (history, schedule) =>
        {
            if (scheduled && (schedule.NextRunAt is null || schedule.NextRunAt > started))
                return (null, null);

            var matches = history.Matches;
            var newMatches = 0;
            if (!failedAll)
            {
                var query = scheduled ? preferences with { MinimumScore = schedule.MinimumScore } : preferences;
                (matches, newMatches) = MergeMatches(matches, offers, tracked, query, completed);
            }

            run = new ScoutRun(id, started, completed, failedAll ? "failed" : "completed", newMatches,
                failed.Length > 0 ? $"Unavailable sources: {string.Join(", ", failed)}." : "Search completed.", scheduled);
            var next = scheduled
                ? schedule with { NextRunAt = failedAll ? completed.AddMinutes(30) : completed.AddHours(schedule.IntervalHours) }
                : null;
            return (new ScoutHistory(matches, history.Runs.Prepend(run).Take(20).ToArray()), next);
        }, token);

        return state is null ? null : new ScoutSearchResult(state, run!);
    }

    internal static async Task<ScoutRun[]> ReadScheduledNoticesAsync(AppDbContext db, Guid userId, CancellationToken token)
    {
        var history = ReadHistory(await ReadSectionAsync(db, userId, HistoryName, token));
        return history.Runs.Where(run => run.Scheduled && run.Status == "completed" && run.NewMatches > 0).Take(10).ToArray();
    }

    internal async Task<Guid[]> DueUsersAsync(CancellationToken token)
    {
        var now = clock.GetUtcNow();
        var rows = await db.WorkspaceSections.AsNoTracking().Where(item => item.Name == ScheduleName).ToListAsync(token);
        return rows.Where(item => Deserialize(item, DefaultSchedule).NextRunAt <= now).Select(item => item.AppUserId).ToArray();
    }

    private async Task<ScoutPreferences> ReadPreferencesAsync(Guid userId, CancellationToken token)
    {
        var row = await ReadSectionAsync(db, userId, "preferences", token);
        var preferences = Deserialize(row, new StoredPreferences([], [], [], [], []));
        var locations = (preferences.Locations ?? []).Concat((preferences.LocationPreferences ?? []).Select(item => item.City)).ToArray();
        return new ScoutPreferences(preferences.Categories ?? [], preferences.Levels ?? [], locations, preferences.WorkModes ?? [], 70);
    }

    private async Task<OfferIdentities> ReadTrackedAsync(Guid userId, CancellationToken token)
    {
        var rows = await db.JobApplications.AsNoTracking().Where(item => item.AppUserId == userId)
            .Select(item => new { item.CompanyName, item.Position, item.OfferUrl }).ToListAsync(token);
        var identities = new OfferIdentities();
        foreach (var item in rows)
            identities.Add(item.CompanyName, item.Position, item.OfferUrl);
        return identities;
    }

    private static (ScoutMatch[] Matches, int NewMatches) MergeMatches(ScoutMatch[] previous, ScoutOffer[] offers,
        OfferIdentities tracked, ScoutPreferences preferences, DateTimeOffset now)
    {
        var known = new OfferIdentities();
        var retained = new List<ScoutMatch>();
        foreach (var match in previous.OrderBy(match => match.Status == "new"))
        {
            var duplicate = known.Contains(match);
            known.Add(match.Company, match.Title, match.ApplyUrl);
            if (!duplicate && (match.Status != "new" || !tracked.Contains(match)))
                retained.Add(match);
        }

        var fresh = new List<ScoutMatch>();
        var candidates = new OfferIdentities();
        var eligible = 0;
        foreach (var match in offers.Select(offer => JobScoutService.Match(offer, preferences, now))
            .OfType<ScoutMatch>().OrderByDescending(match => match.MatchScore).ThenByDescending(match => match.PublishedAt))
        {
            var duplicate = candidates.Contains(match);
            candidates.Add(match.Company, match.Title, match.ApplyUrl);
            if (duplicate || tracked.Contains(match))
                continue;
            if (!known.Contains(match))
                fresh.Add(match);
            if (++eligible == 100)
                break;
        }

        return (fresh.Concat(retained.Where(match => match.Status == "new")).Take(250)
            .Concat(retained.Where(match => match.Status != "new")).ToArray(), fresh.Count);
    }

    private async Task<ScoutSnapshot?> WriteAsync(Guid userId,
        Func<ScoutHistory, ScoutSchedule, (ScoutHistory? History, ScoutSchedule? Schedule)> change, CancellationToken token)
    {
        for (var attempt = 0; ; attempt++)
        {
            var historyRow = await db.WorkspaceSections.FindAsync([userId, HistoryName], token);
            var scheduleRow = await db.WorkspaceSections.FindAsync([userId, ScheduleName], token);
            var history = ReadHistory(historyRow);
            var schedule = Deserialize(scheduleRow, DefaultSchedule);
            var (nextHistory, nextSchedule) = change(history, schedule);
            if (nextHistory is null && nextSchedule is null)
                return null;
            if (nextHistory is not null)
                WriteSection(historyRow, userId, HistoryName, nextHistory);
            if (nextSchedule is not null)
                WriteSection(scheduleRow, userId, ScheduleName, nextSchedule);
            try
            {
                await db.SaveChangesAsync(token);
                return Snapshot(nextHistory ?? history, nextSchedule ?? schedule);
            }
            catch (DbUpdateException exception) when (attempt < 3 && (exception is DbUpdateConcurrencyException ||
                exception.InnerException is SqlException { Number: 2601 or 2627 }))
            {
                db.ChangeTracker.Clear();
            }
        }
    }

    private void WriteSection<T>(WorkspaceSection? row, Guid userId, string name, T data)
    {
        if (row is null)
        {
            row = new WorkspaceSection { AppUserId = userId, Name = name };
            db.WorkspaceSections.Add(row);
        }
        row.Revision = Guid.NewGuid();
        row.Json = JsonSerializer.Serialize(data, JsonOptions);
    }

    private static Task<WorkspaceSection?> ReadSectionAsync(AppDbContext db, Guid userId, string name, CancellationToken token) =>
        db.WorkspaceSections.AsNoTracking().SingleOrDefaultAsync(item => item.AppUserId == userId && item.Name == name, token);

    private static ScoutHistory ReadHistory(WorkspaceSection? row)
    {
        var history = Deserialize(row, EmptyHistory);
        return new ScoutHistory(history.Matches ?? [], history.Runs ?? []);
    }

    private static T Deserialize<T>(WorkspaceSection? row, T fallback)
    {
        if (row is null)
            return fallback;
        try
        {
            return JsonSerializer.Deserialize<T>(row.Json, JsonOptions) ?? fallback;
        }
        catch (JsonException)
        {
            return fallback;
        }
    }

    private static ScoutSnapshot Snapshot(ScoutHistory history, ScoutSchedule schedule) => new(history.Matches, history.Runs, schedule);

    private sealed record StoredPreferences(string[]? Categories, string[]? Levels, string[]? Locations, string[]? WorkModes,
        PreferredLocation[]? LocationPreferences);
    private sealed record PreferredLocation(string City);

    private sealed class OfferIdentities
    {
        private readonly HashSet<string> _titles = [];
        private readonly HashSet<string> _urls = [];

        internal bool Contains(ScoutMatch match) => _titles.Contains(JobScoutService.OfferKey(match.Company, match.Title)) ||
            (JobScoutService.UrlKey(match.ApplyUrl) is { } url && _urls.Contains(url));

        internal void Add(string company, string title, string url)
        {
            _titles.Add(JobScoutService.OfferKey(company, title));
            if (JobScoutService.UrlKey(url) is { } key)
                _urls.Add(key);
        }
    }
}
