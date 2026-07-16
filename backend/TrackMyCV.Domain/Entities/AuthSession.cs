using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class AuthSession : BaseEntity
{
    public Guid AppUserId { get; set; }

    public AppUser AppUser { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public DateTime? LastUsedAt { get; set; }
}
