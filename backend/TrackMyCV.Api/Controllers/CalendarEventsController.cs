using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/calendar-events")]
public class CalendarEventsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CalendarEventsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<CalendarEventDto>>> GetAll()
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var events = await _dbContext.NotificationCalendarEvents
            .Where(x => x.AppUserId == userId.Value)
            .OrderBy(x => x.EventDate)
            .ThenBy(x => x.StartTime)
            .AsNoTracking()
            .ToListAsync();

        return Ok(events.Select(MapToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CalendarEventDto>> Upsert(CalendarEventRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        if (ValidateEvent(request) is { } validationProblem)
        {
            return validationProblem;
        }

        var clientEventId = Clean(request.ClientEventId, 120);
        var calendarEvent = await _dbContext.NotificationCalendarEvents
            .FirstOrDefaultAsync(x => x.AppUserId == userId.Value && x.ClientEventId == clientEventId);

        if (calendarEvent is null)
        {
            calendarEvent = new NotificationCalendarEvent
            {
                AppUserId = userId.Value,
                ClientEventId = clientEventId
            };
            _dbContext.NotificationCalendarEvents.Add(calendarEvent);
        }

        ApplyRequest(calendarEvent, request);
        await _dbContext.SaveChangesAsync();

        return Ok(MapToDto(calendarEvent));
    }

    [HttpPut("{clientEventId}")]
    public async Task<ActionResult<CalendarEventDto>> Update(string clientEventId, CalendarEventRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        if (ValidateEvent(request) is { } validationProblem)
        {
            return validationProblem;
        }

        var calendarEvent = await _dbContext.NotificationCalendarEvents
            .FirstOrDefaultAsync(x => x.AppUserId == userId.Value && x.ClientEventId == clientEventId);

        if (calendarEvent is null)
        {
            return NotFound();
        }

        ApplyRequest(calendarEvent, request);
        await _dbContext.SaveChangesAsync();

        return Ok(MapToDto(calendarEvent));
    }

    [HttpDelete("{clientEventId}")]
    public async Task<IActionResult> Delete(string clientEventId)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var calendarEvent = await _dbContext.NotificationCalendarEvents
            .FirstOrDefaultAsync(x => x.AppUserId == userId.Value && x.ClientEventId == clientEventId);

        if (calendarEvent is null)
        {
            return NoContent();
        }

        _dbContext.NotificationCalendarEvents.Remove(calendarEvent);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private ActionResult? ValidateEvent(CalendarEventRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.ClientEventId))
        {
            errors.Add("Event id is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors.Add("Event title is required.");
        }

        if (request.EventDate == default)
        {
            errors.Add("Event date is required.");
        }

        if (request.EndTime is not null && request.EndTime <= request.StartTime)
        {
            errors.Add("End time must be later than start time.");
        }

        if (!string.IsNullOrWhiteSpace(request.MeetingLink) &&
            (!Uri.TryCreate(request.MeetingLink.Trim(), UriKind.Absolute, out var uri) ||
             (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
        {
            errors.Add("Meeting link must be a valid http or https URL.");
        }

        return errors.Count == 0 ? null : BadRequest(new { message = "Correct the highlighted fields.", errors });
    }

    private static void ApplyRequest(NotificationCalendarEvent calendarEvent, CalendarEventRequest request)
    {
        calendarEvent.Title = Clean(request.Title, 220);
        calendarEvent.Company = Clean(request.Company, 180);
        calendarEvent.ApplicationId = Clean(request.ApplicationId, 120);
        calendarEvent.EventType = Clean(request.EventType, 100);
        calendarEvent.EventDate = request.EventDate;
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.Location = Clean(request.Location, 180);
        calendarEvent.MeetingLink = Clean(request.MeetingLink, 700);
        calendarEvent.DetailedPlan = Clean(request.DetailedPlan, 12000);
        calendarEvent.Icon = Clean(request.Icon, 80);
        calendarEvent.Color = Clean(request.Color, 40);
        calendarEvent.UpdatedAt = DateTime.UtcNow;
    }

    private static CalendarEventDto MapToDto(NotificationCalendarEvent calendarEvent)
    {
        return new CalendarEventDto(
            calendarEvent.ClientEventId,
            calendarEvent.Title,
            calendarEvent.Company,
            calendarEvent.ApplicationId,
            calendarEvent.EventType,
            calendarEvent.EventDate,
            calendarEvent.StartTime,
            calendarEvent.EndTime,
            calendarEvent.Location,
            calendarEvent.MeetingLink,
            calendarEvent.DetailedPlan,
            calendarEvent.Icon,
            calendarEvent.Color);
    }

    private static string Clean(string? value, int maxLength)
    {
        var clean = value?.Trim() ?? string.Empty;
        return clean.Length <= maxLength ? clean : clean[..maxLength];
    }
}

public record CalendarEventDto(
    string ClientEventId,
    string Title,
    string Company,
    string ApplicationId,
    string EventType,
    DateOnly EventDate,
    TimeOnly StartTime,
    TimeOnly? EndTime,
    string Location,
    string MeetingLink,
    string DetailedPlan,
    string Icon,
    string Color);

public record CalendarEventRequest(
    string ClientEventId,
    string Title,
    string Company,
    string ApplicationId,
    string EventType,
    DateOnly EventDate,
    TimeOnly StartTime,
    TimeOnly? EndTime,
    string Location,
    string MeetingLink,
    string DetailedPlan,
    string Icon,
    string Color);
