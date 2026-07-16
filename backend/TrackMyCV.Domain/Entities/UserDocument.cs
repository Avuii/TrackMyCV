using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class UserDocument : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    public string RelativePath { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public string TargetRole { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";

    public string Notes { get; set; } = string.Empty;

    public string Tags { get; set; } = string.Empty;

    public int SuccessRate { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public bool IsDefault { get; set; }
}
