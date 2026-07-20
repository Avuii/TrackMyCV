using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class UserNotificationSettings : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public string Email { get; set; } = string.Empty;

    public bool InterviewReminders { get; set; } = true;

    public bool FollowUpReminders { get; set; } = true;

    public bool ApplicationDeadlines { get; set; }

    public bool WeeklySummary { get; set; } = true;

    public bool MonthlyReport { get; set; }

    public string ReminderTime { get; set; } = "15 minutes before";
}
