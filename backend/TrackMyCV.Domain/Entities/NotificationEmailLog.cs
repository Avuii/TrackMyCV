using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class NotificationEmailLog : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public string NotificationType { get; set; } = string.Empty;

    public string NotificationKey { get; set; } = string.Empty;

    public string RecipientEmail { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
}
