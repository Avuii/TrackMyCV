using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.Notifications;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private static readonly HashSet<string> ReminderTimeOptions = new(StringComparer.OrdinalIgnoreCase)
    {
        "15 minutes before",
        "1 hour before",
        "1 day before"
    };

    private readonly AppDbContext _dbContext;
    private readonly IEmailSender _emailSender;

    public NotificationsController(AppDbContext dbContext, IEmailSender emailSender)
    {
        _dbContext = dbContext;
        _emailSender = emailSender;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<NotificationSettingsDto>> GetSettings()
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var settings = await GetOrCreateSettings(userId.Value);

        return Ok(MapSettings(settings, _emailSender.IsConfigured));
    }

    [HttpPut("settings")]
    public async Task<ActionResult<NotificationSettingsDto>> UpdateSettings(NotificationSettingsRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var email = NormalizeEmail(request.Email);

        if (!IsValidEmail(email))
        {
            return BadRequest("Enter a valid notification email address.");
        }

        if (!ReminderTimeOptions.Contains(request.ReminderTime))
        {
            return BadRequest("Choose a supported reminder time.");
        }

        var settings = await GetOrCreateSettings(userId.Value);
        settings.Email = email;
        settings.InterviewReminders = request.InterviewReminders;
        settings.FollowUpReminders = request.FollowUpReminders;
        settings.ApplicationDeadlines = request.ApplicationDeadlines;
        settings.WeeklySummary = request.WeeklySummary;
        settings.MonthlyReport = request.MonthlyReport;
        settings.ReminderTime = request.ReminderTime;
        settings.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(MapSettings(settings, _emailSender.IsConfigured));
    }

    [HttpPost("test-email")]
    public async Task<ActionResult<NotificationTestEmailResponse>> SendTestEmail(CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var settings = await GetOrCreateSettings(userId.Value);
        var subject = "TrackMyCV notifications are ready";
        var body = "This is a test email from TrackMyCV. Your notification sender is configured correctly.";
        var result = await _emailSender.SendAsync(settings.Email, subject, body, cancellationToken);

        if (!result.Sent)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new NotificationTestEmailResponse(false, result.Message));
        }

        LogEmail(userId.Value, "test-email", $"test:{Guid.NewGuid():N}", settings.Email, subject);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new NotificationTestEmailResponse(true, result.Message));
    }

    [HttpPost("calendar-events")]
    public async Task<IActionResult> UpsertCalendarEvent(NotificationCalendarEventRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.ClientEventId) || string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Event id and title are required.");
        }

        var existing = await _dbContext.NotificationCalendarEvents
            .FirstOrDefaultAsync(x => x.AppUserId == userId.Value && x.ClientEventId == request.ClientEventId);

        if (existing is null)
        {
            existing = new NotificationCalendarEvent
            {
                AppUserId = userId.Value,
                ClientEventId = Clean(request.ClientEventId, 120)
            };
            _dbContext.NotificationCalendarEvents.Add(existing);
        }

        existing.Title = Clean(request.Title, 220);
        existing.Company = Clean(request.Company, 180);
        existing.ApplicationId = Clean(request.ApplicationId, 120);
        existing.EventType = Clean(request.EventType, 100);
        existing.EventDate = request.EventDate;
        existing.StartTime = request.StartTime;
        existing.EndTime = request.EndTime;
        existing.Location = Clean(request.Location, 180);
        existing.MeetingLink = Clean(request.MeetingLink, 700);
        existing.DetailedPlan = Clean(request.DetailedPlan, 12000);
        existing.Icon = Clean(request.Icon, 80);
        existing.Color = Clean(request.Color, 40);
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("calendar-events/{clientEventId}")]
    public async Task<IActionResult> DeleteCalendarEvent(string clientEventId)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var existing = await _dbContext.NotificationCalendarEvents
            .FirstOrDefaultAsync(x => x.AppUserId == userId.Value && x.ClientEventId == clientEventId);

        if (existing is null)
        {
            return NoContent();
        }

        _dbContext.NotificationCalendarEvents.Remove(existing);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private async Task<UserNotificationSettings> GetOrCreateSettings(Guid userId)
    {
        var settings = await _dbContext.UserNotificationSettings.FirstOrDefaultAsync(x => x.AppUserId == userId);

        if (settings is not null)
        {
            return settings;
        }

        var user = await _dbContext.AppUsers.FindAsync(userId);

        if (user is null)
        {
            throw new InvalidOperationException("Current user was not found.");
        }

        settings = new UserNotificationSettings
        {
            AppUserId = userId,
            Email = user.Email
        };

        _dbContext.UserNotificationSettings.Add(settings);
        await _dbContext.SaveChangesAsync();

        return settings;
    }

    private void LogEmail(Guid userId, string type, string key, string recipientEmail, string subject)
    {
        _dbContext.NotificationEmailLogs.Add(new NotificationEmailLog
        {
            AppUserId = userId,
            NotificationType = type,
            NotificationKey = key,
            RecipientEmail = recipientEmail,
            Subject = subject,
            SentAtUtc = DateTime.UtcNow
        });
    }

    private static NotificationSettingsDto MapSettings(UserNotificationSettings settings, bool emailConfigured)
    {
        return new NotificationSettingsDto(
            settings.Email,
            settings.InterviewReminders,
            settings.FollowUpReminders,
            settings.ApplicationDeadlines,
            settings.WeeklySummary,
            settings.MonthlyReport,
            settings.ReminderTime,
            emailConfigured);
    }

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string Clean(string? value, int maxLength)
    {
        var clean = value?.Trim() ?? string.Empty;
        return clean.Length <= maxLength ? clean : clean[..maxLength];
    }
}

public record NotificationSettingsDto(
    string Email,
    bool InterviewReminders,
    bool FollowUpReminders,
    bool ApplicationDeadlines,
    bool WeeklySummary,
    bool MonthlyReport,
    string ReminderTime,
    bool EmailConfigured);

public record NotificationSettingsRequest(
    string Email,
    bool InterviewReminders,
    bool FollowUpReminders,
    bool ApplicationDeadlines,
    bool WeeklySummary,
    bool MonthlyReport,
    string ReminderTime);

public record NotificationCalendarEventRequest(
    string ClientEventId,
    string Title,
    string Company,
    string EventType,
    DateOnly EventDate,
    TimeOnly StartTime,
    TimeOnly? EndTime,
    string Location,
    string ApplicationId = "",
    string MeetingLink = "",
    string DetailedPlan = "",
    string Icon = "",
    string Color = "");

public record NotificationTestEmailResponse(bool Sent, string Message);
