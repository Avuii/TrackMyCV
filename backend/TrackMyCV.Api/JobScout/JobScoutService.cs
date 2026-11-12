using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;

namespace TrackMyCV.Api.JobScout;

public record ScoutPreferences(string[] Categories, string[] Levels, string[] Locations, string[] WorkModes, int MinimumScore);
public record ScoutOffer(string Id, string Title, string Company, string Location, string WorkMode,
    DateTimeOffset PublishedAt, string Source, string Url, string[] Tags);
public record ScoutMatch(string Id, string Title, string Company, string Location, string WorkMode,
    DateTimeOffset PublishedAt, DateTimeOffset FoundAt, string Source, string SourceUrl, string ApplyUrl,
    int MatchScore, string MatchReason, string[] MatchedSkills, string[] Gaps, string Status);

public sealed class JobScoutService(HttpClient client, IMemoryCache cache, ILogger<JobScoutService> logger)
{
    private static readonly (string Name, string Url)[] Feeds =
    [
        ("Arbeitnow Europe", "https://www.arbeitnow.com/api/job-board-api"),
        ("Arbeitnow UK", "https://www.arbeitnow.co.uk/api/job-board-api")
    ];
    public static string[] Sources => Feeds.Select(feed => feed.Name).ToArray();
    private static readonly SemaphoreSlim RefreshLock = new(1);

    public async Task<(ScoutOffer[] Offers, string[] Failed)> ReadFeeds(CancellationToken cancellationToken)
    {
        await RefreshLock.WaitAsync(cancellationToken);
        try
        {
            var feeds = await Task.WhenAll(Feeds.Select(async feed =>
            {
                if (cache.TryGetValue(feed.Url, out ScoutOffer[]? cached))
                    return (Offers: cached, Name: feed.Name);

                try
                {
                    var result = await client.GetFromJsonAsync<Feed>(feed.Url, cancellationToken);
                    var offers = (result?.Data ?? [])
                        .Where(item => !string.IsNullOrWhiteSpace(item.Slug) && !string.IsNullOrWhiteSpace(item.Title)
                            && !string.IsNullOrWhiteSpace(item.Company) && IsArbeitnowUrl(item.Url))
                        .Select(item => new ScoutOffer($"{feed.Name}:{item.Slug}", item.Title, item.Company,
                            item.Location ?? "", GetWorkMode(item),
                            DateTimeOffset.FromUnixTimeSeconds(item.CreatedAt), feed.Name, item.Url, item.Tags ?? []))
                        .ToArray();
                    cache.Set(feed.Url, offers, TimeSpan.FromMinutes(30));
                    return (Offers: (ScoutOffer[]?)offers, Name: feed.Name);
                }
                catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
                {
                    logger.LogWarning(exception, "Could not load jobs from {Source}", feed.Name);
                    return (Offers: (ScoutOffer[]?)null, Name: feed.Name);
                }
            }));
            return (feeds.SelectMany(feed => feed.Offers ?? []).ToArray(),
                feeds.Where(feed => feed.Offers is null).Select(feed => feed.Name).ToArray());
        }
        finally
        {
            RefreshLock.Release();
        }
    }

    public static ScoutMatch? Match(ScoutOffer offer, ScoutPreferences preferences, DateTimeOffset foundAt)
    {
        var roles = Normalize(preferences.Categories).Where(value => value is not "Other" and not "General").ToArray();
        var levels = Normalize(preferences.Levels);
        var locations = Normalize(preferences.Locations);
        var modes = Normalize(preferences.WorkModes).Where(value => value != "All work modes").ToArray();
        var title = offer.Title;
        var searchable = string.Join(" ", offer.Tags.Prepend(title));
        var matched = roles.Where(role => ContainsTerm(searchable, role)).ToArray();
        if (roles.Length > 0 && matched.Length == 0)
            return null;

        var senior = Regex.IsMatch(title, @"\b(senior|sr\.?|lead|principal|staff|head)\b", RegexOptions.IgnoreCase);
        var earlyCareer = levels.Length > 0 && levels.All(level =>
            Regex.IsMatch(level, @"junior|intern|entry|trainee", RegexOptions.IgnoreCase));
        if (senior && earlyCareer)
            return null;

        var score = roles.Length == 0 ? 55 : 65;
        var reasons = new List<string>();
        var gaps = new List<string>();
        if (matched.Length > 0)
            reasons.Add($"Matches {string.Join(", ", matched)}");

        ApplyPreference(levels, levels.Any(level => ContainsTerm(searchable, level))
            || (earlyCareer && Regex.IsMatch(searchable, @"\b(intern(ship)?|trainee|junior|entry.level)\b", RegexOptions.IgnoreCase)),
            15, "experience level");
        ApplyPreference(locations, locations.Any(location => ContainsTerm(offer.Location, location)),
            10, "location");
        ApplyPreference(modes, modes.Contains(offer.WorkMode, StringComparer.OrdinalIgnoreCase), 10, "work mode");

        if (score < Math.Clamp(preferences.MinimumScore, 0, 100))
            return null;

        return new ScoutMatch(offer.Id, title, offer.Company, offer.Location, offer.WorkMode, offer.PublishedAt,
            foundAt, offer.Source, offer.Url, offer.Url, score,
            reasons.Count == 0 ? "Recent listing from the selected sources." : string.Join(" · ", reasons),
            matched, gaps.ToArray(), "new");

        void ApplyPreference(string[] values, bool match, int weight, string label)
        {
            if (values.Length == 0 || match)
                score += weight;
            if (values.Length == 0)
                return;
            if (match)
                reasons.Add($"Matches preferred {label}");
            else
                gaps.Add($"Preferred {label} is not confirmed");
        }
    }

    public static string OfferKey(string company, string title) => $"{company.Trim().ToUpperInvariant()}\n{title.Trim().ToUpperInvariant()}";

    private static string[] Normalize(string[]? values) => (values ?? [])
        .Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase).Take(30).ToArray();

    private static bool ContainsTerm(string value, string term) =>
        Regex.IsMatch(value, $@"(?<![\p{{L}}\p{{N}}]){Regex.Escape(term)}(?![\p{{L}}\p{{N}}])", RegexOptions.IgnoreCase);

    private static string GetWorkMode(FeedItem item)
    {
        if (ContainsTerm(item.Title + " " + item.Location + " " + string.Join(" ", item.Tags ?? []), "hybrid"))
            return "Hybrid";
        return item.Remote ? "Remote" : "On-site";
    }

    private static bool IsArbeitnowUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == "https" &&
        (uri.Host is "www.arbeitnow.com" or "arbeitnow.com" or "www.arbeitnow.co.uk" or "arbeitnow.co.uk");

    private sealed record Feed(FeedItem[] Data);
    private sealed record FeedItem(string Slug, string Title, [property: JsonPropertyName("company_name")] string Company,
        string? Location, bool Remote, string Url, string[]? Tags,
        [property: JsonPropertyName("created_at")] long CreatedAt);
}
