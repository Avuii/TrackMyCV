using System.Globalization;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Domain.Enums;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Notifications;

public class NotificationBackgroundService : BackgroundService
{
    private static readonly ApplicationStatus[] FollowUpStatuses =
    [
        ApplicationStatus.Applied,
        ApplicationStatus.InProgress,
        ApplicationStatus.Interview,
        ApplicationStatus.TaskOrTest
    ];

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationBackgroundService> _logger;

    public NotificationBackgroundService(IServiceScopeFactory scopeFactory, ILogger<NotificationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunSafely(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunSafely(stoppingToken);
        }
    }

    private async Task RunSafely(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

            if (!emailSender.IsConfigured)
            {
                _logger.LogDebug("TrackMyCV email sender is not configured. Notification scan skipped.");
                return;
            }

            var settings = await dbContext.UserNotificationSettings
                .AsNoTracking()
                .Where(x => x.Email != string.Empty)
                .ToListAsync(cancellationToken);

            foreach (var userSettings in settings)
            {
                await ProcessCalendarEvents(dbContext, emailSender, userSettings, cancellationToken);
                await ProcessApplicationFollowUps(dbContext, emailSender, userSettings, cancellationToken);
                await ProcessSummary(dbContext, emailSender, userSettings, cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "TrackMyCV notification scan failed.");
        }
    }

    private static async Task ProcessCalendarEvents(
        AppDbContext dbContext,
        IEmailSender emailSender,
        UserNotificationSettings settings,
        CancellationToken cancellationToken)
    {
        var now = DateTime.Now;
        var fromDate = DateOnly.FromDateTime(now.AddDays(-1));
        var toDate = DateOnly.FromDateTime(now.AddDays(2));
        var events = await dbContext.NotificationCalendarEvents
            .Where(x => x.AppUserId == settings.AppUserId && x.EventDate >= fromDate && x.EventDate <= toDate)
            .ToListAsync(cancellationToken);

        foreach (var calendarEvent in events)
        {
            var startAt = calendarEvent.EventDate.ToDateTime(calendarEvent.StartTime);

            if (now > startAt.AddHours(2))
            {
                continue;
            }

            if (settings.InterviewReminders && IsInterview(calendarEvent))
            {
                await TrySendCalendarReminder(dbContext, emailSender, settings, calendarEvent, "interview-24h", startAt.AddDays(-1), cancellationToken);
                await TrySendCalendarReminder(dbContext, emailSender, settings, calendarEvent, "interview-1h", startAt.AddHours(-1), cancellationToken);
            }

            if (settings.ApplicationDeadlines && IsDeadline(calendarEvent))
            {
                await TrySendCalendarReminder(dbContext, emailSender, settings, calendarEvent, "deadline", startAt - ReminderOffset(settings.ReminderTime), cancellationToken);
            }

            if (settings.FollowUpReminders && IsFollowUp(calendarEvent))
            {
                await TrySendCalendarReminder(dbContext, emailSender, settings, calendarEvent, "follow-up-event", startAt - ReminderOffset(settings.ReminderTime), cancellationToken);
            }
        }
    }

    private static async Task TrySendCalendarReminder(
        AppDbContext dbContext,
        IEmailSender emailSender,
        UserNotificationSettings settings,
        NotificationCalendarEvent calendarEvent,
        string kind,
        DateTime remindAt,
        CancellationToken cancellationToken)
    {
        if (DateTime.Now < remindAt)
        {
            return;
        }

        var key = $"{calendarEvent.ClientEventId}:{kind}";

        if (await WasSent(dbContext, settings.AppUserId, "calendar-reminder", key, cancellationToken))
        {
            return;
        }

        var subject = $"Reminder: {calendarEvent.Title}";
        var body = string.Join(Environment.NewLine, [
            $"TrackMyCV reminder: {calendarEvent.Title}",
            $"Company: {calendarEvent.Company}",
            $"Type: {calendarEvent.EventType}",
            $"When: {calendarEvent.EventDate:yyyy-MM-dd} {calendarEvent.StartTime:HH\\:mm}",
            string.IsNullOrWhiteSpace(calendarEvent.Location) ? string.Empty : $"Location: {calendarEvent.Location}"
        ]).Trim();

        await SendAndLog(dbContext, emailSender, settings.AppUserId, settings.Email, "calendar-reminder", key, subject, body, cancellationToken);
    }

    private static async Task ProcessApplicationFollowUps(
        AppDbContext dbContext,
        IEmailSender emailSender,
        UserNotificationSettings settings,
        CancellationToken cancellationToken)
    {
        if (!settings.FollowUpReminders)
        {
            return;
        }

        var dueOnOrBefore = DateOnly.FromDateTime(DateTime.Today.AddDays(-7));
        var applications = await dbContext.JobApplications
            .Where(x => x.AppUserId == settings.AppUserId && FollowUpStatuses.Contains(x.Status))
            .ToListAsync(cancellationToken);

        foreach (var application in applications)
        {
            var referenceDate = application.LastContact ?? application.DateApplied;

            if (referenceDate > dueOnOrBefore)
            {
                continue;
            }

            var key = $"{application.Id}:{referenceDate:yyyyMMdd}";

            if (await WasSent(dbContext, settings.AppUserId, "application-follow-up", key, cancellationToken))
            {
                continue;
            }

            var subject = $"Follow up: {application.CompanyName}";
            var body = string.Join(Environment.NewLine, [
                $"TrackMyCV follow-up reminder",
                $"Company: {application.CompanyName}",
                $"Position: {application.Position}",
                $"Status: {application.Status}",
                $"Last contact/date applied: {referenceDate:yyyy-MM-dd}",
                string.IsNullOrWhiteSpace(application.NextStep) ? string.Empty : $"Next step: {application.NextStep}"
            ]).Trim();

            await SendAndLog(dbContext, emailSender, settings.AppUserId, settings.Email, "application-follow-up", key, subject, body, cancellationToken);
        }
    }

    private static async Task ProcessSummary(
        AppDbContext dbContext,
        IEmailSender emailSender,
        UserNotificationSettings settings,
        CancellationToken cancellationToken)
    {
        var now = DateTime.Now;

        if (settings.WeeklySummary && now.DayOfWeek == DayOfWeek.Monday && now.Hour >= 8)
        {
            var week = ISOWeek.GetWeekOfYear(now);
            var key = $"{now.Year}-W{week:00}";

            if (!await WasSent(dbContext, settings.AppUserId, "weekly-summary", key, cancellationToken))
            {
                var subject = "Your weekly TrackMyCV summary";
                var body = await BuildSummaryBody(dbContext, settings.AppUserId, "Weekly recruitment summary", cancellationToken);
                await SendAndLog(dbContext, emailSender, settings.AppUserId, settings.Email, "weekly-summary", key, subject, body, cancellationToken);
            }
        }

        if (settings.MonthlyReport && now.Day == 1 && now.Hour >= 8)
        {
            var key = $"{now:yyyy-MM}";

            if (!await WasSent(dbContext, settings.AppUserId, "monthly-report", key, cancellationToken))
            {
                var subject = "Your monthly TrackMyCV statistics";
                var body = await BuildSummaryBody(dbContext, settings.AppUserId, "Monthly recruitment statistics", cancellationToken);
                await SendAndLog(dbContext, emailSender, settings.AppUserId, settings.Email, "monthly-report", key, subject, body, cancellationToken);
            }
        }
    }

    private static async Task<string> BuildSummaryBody(AppDbContext dbContext, Guid userId, string title, CancellationToken cancellationToken)
    {
        var applications = await dbContext.JobApplications
            .Where(x => x.AppUserId == userId)
            .ToListAsync(cancellationToken);

        var active = applications.Count(x => FollowUpStatuses.Contains(x.Status));
        var interviews = applications.Count(x => x.Status is ApplicationStatus.Interview or ApplicationStatus.TaskOrTest or ApplicationStatus.Offer);
        var offers = applications.Count(x => x.Status == ApplicationStatus.Offer);
        var rejected = applications.Count(x => x.Status == ApplicationStatus.Rejected);

        return string.Join(Environment.NewLine, [
            title,
            string.Empty,
            $"Total applications: {applications.Count}",
            $"Active processes: {active}",
            $"Interview/task stages: {interviews}",
            $"Offers: {offers}",
            $"Rejected: {rejected}",
            string.Empty,
            "Open TrackMyCV to review next steps and update your tracker."
        ]);
    }

    private static async Task<bool> WasSent(AppDbContext dbContext, Guid userId, string type, string key, CancellationToken cancellationToken)
    {
        return await dbContext.NotificationEmailLogs
            .AnyAsync(x => x.AppUserId == userId && x.NotificationType == type && x.NotificationKey == key, cancellationToken);
    }

    private static async Task SendAndLog(
        AppDbContext dbContext,
        IEmailSender emailSender,
        Guid userId,
        string recipientEmail,
        string type,
        string key,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var result = await emailSender.SendAsync(recipientEmail, subject, body, cancellationToken);

        if (!result.Sent)
        {
            return;
        }

        dbContext.NotificationEmailLogs.Add(new NotificationEmailLog
        {
            AppUserId = userId,
            NotificationType = type,
            NotificationKey = key,
            RecipientEmail = recipientEmail,
            Subject = subject,
            SentAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static TimeSpan ReminderOffset(string reminderTime)
    {
        return reminderTime.ToLowerInvariant() switch
        {
            "1 day before" => TimeSpan.FromDays(1),
            "1 hour before" => TimeSpan.FromHours(1),
            _ => TimeSpan.FromMinutes(15)
        };
    }

    private static bool IsInterview(NotificationCalendarEvent calendarEvent)
    {
        return ContainsAny(calendarEvent, "interview", "hr interview", "technical interview");
    }

    private static bool IsDeadline(NotificationCalendarEvent calendarEvent)
    {
        return ContainsAny(calendarEvent, "deadline", "task", "test");
    }

    private static bool IsFollowUp(NotificationCalendarEvent calendarEvent)
    {
        return ContainsAny(calendarEvent, "follow-up", "follow up", "thank-you", "thank you");
    }

    private static bool ContainsAny(NotificationCalendarEvent calendarEvent, params string[] needles)
    {
        var text = $"{calendarEvent.Title} {calendarEvent.EventType}".ToLowerInvariant();
        return needles.Any(text.Contains);
    }
}
