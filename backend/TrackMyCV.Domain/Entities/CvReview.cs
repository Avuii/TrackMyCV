using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class CvReview : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public Guid DocumentId { get; set; }

    public UserDocument Document { get; set; } = null!;

    public string DocumentName { get; set; } = string.Empty;

    public string ReviewType { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public string JobTitle { get; set; } = string.Empty;

    public string ExperienceLevel { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";

    public int? OverallScore { get; set; }

    public int? JobMatchScore { get; set; }

    public string ResultJson { get; set; } = string.Empty;

    public string ErrorMessage { get; set; } = string.Empty;

    public DateTime? CompletedAt { get; set; }
}
