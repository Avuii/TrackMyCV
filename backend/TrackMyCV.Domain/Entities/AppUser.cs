using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class AppUser : BaseEntity
{
    public string Email { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();

    public ICollection<UserDocument> Documents { get; set; } = new List<UserDocument>();

    public ICollection<AuthSession> AuthSessions { get; set; } = new List<AuthSession>();

    public UserNotificationSettings? NotificationSettings { get; set; }

    public ICollection<NotificationCalendarEvent> NotificationCalendarEvents { get; set; } = new List<NotificationCalendarEvent>();

    public ICollection<NotificationEmailLog> NotificationEmailLogs { get; set; } = new List<NotificationEmailLog>();

    public ICollection<CvReview> CvReviews { get; set; } = new List<CvReview>();
}
