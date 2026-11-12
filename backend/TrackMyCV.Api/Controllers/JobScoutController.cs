using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.JobScout;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/job-scout")]
public sealed class JobScoutController(JobScoutService scout, AppDbContext db) : ControllerBase
{
    [HttpGet("sources")]
    public IActionResult Sources() => HttpContext.GetCurrentUserId() is null ? Unauthorized() : Ok(JobScoutService.Sources);

    [HttpPost("search")]
    [EnableRateLimiting("ai")]
    [RequestSizeLimit(32768)]
    public async Task<IActionResult> Search(ScoutPreferences preferences, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();

        var (offers, failedSources) = await scout.ReadFeeds(cancellationToken);
        if (failedSources.Length == JobScoutService.Sources.Length)
            return StatusCode(503, new { message = "The job sources are temporarily unavailable. Try again later." });

        var tracked = await db.JobApplications.Where(item => item.AppUserId == userId)
            .Select(item => new { item.CompanyName, item.Position, item.OfferUrl }).ToListAsync(cancellationToken);
        var keys = tracked.Select(item => JobScoutService.OfferKey(item.CompanyName, item.Position)).ToHashSet();
        var urls = tracked.Select(item => item.OfferUrl).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var now = DateTimeOffset.UtcNow;
        var matches = offers
            .Where(offer => !urls.Contains(offer.Url) && !keys.Contains(JobScoutService.OfferKey(offer.Company, offer.Title)))
            .Select(offer => JobScoutService.Match(offer, preferences, now))
            .OfType<ScoutMatch>()
            .OrderByDescending(match => match.MatchScore)
            .ThenByDescending(match => match.PublishedAt)
            .DistinctBy(match => JobScoutService.OfferKey(match.Company, match.Title))
            .Take(100);
        return Ok(new { matches, failedSources });
    }
}
