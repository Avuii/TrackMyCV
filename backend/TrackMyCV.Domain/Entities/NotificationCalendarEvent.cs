using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class NotificationCalendarEvent : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public string ClientEventId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Company { get; set; } = string.Empty;

    public string ApplicationId { get; set; } = string.Empty;

    public string EventType { get; set; } = string.Empty;

    public DateOnly EventDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public string Location { get; set; } = string.Empty;

    public string MeetingLink { get; set; } = string.Empty;

    public string DetailedPlan { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;
}
