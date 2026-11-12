namespace TrackMyCV.Domain.Entities;

public sealed class ApplicationActivity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AppUserId { get; set; }
    public Guid ApplicationId { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public Guid? DocumentId { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    public static ApplicationActivity Record(JobApplication application, Guid owner, string kind, string detail, Guid? documentId = null) =>
        new()
        {
            AppUserId = owner, ApplicationId = application.Id, Company = application.CompanyName,
            Position = application.Position, Kind = kind, Detail = detail, DocumentId = documentId
        };
}
