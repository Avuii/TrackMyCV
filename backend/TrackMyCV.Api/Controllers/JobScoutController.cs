using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.JobScout;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/job-scout")]
public sealed class JobScoutController(JobScoutWorkspace workspace) : ControllerBase
{
    [HttpGet("sources")]
    public IActionResult Sources() => HttpContext.GetCurrentUserId() is null ? Unauthorized() : Ok(JobScoutService.Sources);

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken token) =>
        HttpContext.GetCurrentUserId() is Guid userId ? Ok(await workspace.GetAsync(userId, token)) : Unauthorized();

    [HttpPost("search")]
    [EnableRateLimiting("ai")]
    [RequestSizeLimit(32768)]
    public async Task<IActionResult> Search(ScoutPreferences preferences, CancellationToken token)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();

        var result = await workspace.SearchAsync(userId, preferences, token);
        return Ok(result);
    }

    [HttpPut("schedule")]
    public async Task<IActionResult> Schedule(ScoutScheduleRequest request, CancellationToken token)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();
        if (request.IntervalHours is not (0 or 6 or 12 or 24))
            return BadRequest(new { message = "Choose a supported search interval." });

        return Ok(await workspace.SetScheduleAsync(userId, request.IntervalHours, request.MinimumScore, token));
    }

    [HttpPut("matches/status")]
    public async Task<IActionResult> Status(ScoutStatusRequest request, CancellationToken token)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();
        if (request.Status is not ("new" or "saved" or "ignored" or "added"))
            return BadRequest(new { message = "Choose a supported match status." });

        var state = await workspace.SetStatusAsync(userId, request.Id, request.Status, token);
        return state is null ? NotFound() : Ok(state);
    }

    public record ScoutScheduleRequest(int IntervalHours, [Range(0, 100)] int MinimumScore);
    public record ScoutStatusRequest([StringLength(400)] string Id, string Status);
}
