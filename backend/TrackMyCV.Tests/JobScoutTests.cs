using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using TrackMyCV.Api.JobScout;
using Xunit;

namespace TrackMyCV.Tests;

public sealed class JobScoutTests
{
    [Fact]
    public async Task FetchesBothFeedsAndReusesSuccessfulResponses()
    {
        using var handler = new FeedHandler();
        using var client = new HttpClient(handler);
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var scout = new JobScoutService(client, cache, NullLogger<JobScoutService>.Instance);
        var (offers, failures) = await scout.ReadFeeds(default);

        Assert.Equal(2, offers.Length);
        Assert.Empty(failures);
        Assert.Equal(2, offers.Select(offer => offer.Source).Distinct().Count());
        Assert.All(offers, offer => Assert.Equal("Remote", offer.WorkMode));
        await scout.ReadFeeds(default);
        Assert.Equal(2, handler.Requests);
    }

    [Fact]
    public void ScoresRelevantRolesAndRejectsSeniorRolesForAnEarlyCareerSearch()
    {
        var offer = new ScoutOffer("job-1", "Junior .NET Developer", "Example", "Warsaw", "Hybrid",
            DateTimeOffset.UtcNow, "Example feed", "https://example.test/job", ["C#"]);
        var preferences = new ScoutPreferences([".NET"], ["Junior"], ["Warsaw"], ["Hybrid"], 70);
        var match = JobScoutService.Match(offer, preferences, DateTimeOffset.UtcNow);
        Assert.NotNull(match);
        Assert.Equal(100, match.MatchScore);
        Assert.Contains(".NET", match.MatchedSkills);
        Assert.Null(JobScoutService.Match(offer with { Title = "Senior .NET Developer" }, preferences, DateTimeOffset.UtcNow));
        Assert.Null(JobScoutService.Match(offer with { Title = "Junior DevOps Engineer" }, preferences, DateTimeOffset.UtcNow));
    }

    private sealed class FeedHandler : HttpMessageHandler
    {
        private int _requests;
        public int Requests => _requests;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _requests);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""
                    {"data":[{"slug":"developer","title":"Junior .NET Developer","company_name":"Example",
                    "location":"Warsaw","remote":true,"url":"https://www.arbeitnow.com/jobs/example/developer",
                    "tags":[".NET"],"created_at":1700000000}]}
                    """, System.Text.Encoding.UTF8, "application/json")
            });
        }
    }
}
