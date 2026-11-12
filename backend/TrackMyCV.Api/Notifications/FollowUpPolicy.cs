using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Domain.Enums;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Notifications;

internal static class FollowUpPolicy
{
    internal static readonly ApplicationStatus[] ActiveStatuses =
        [ApplicationStatus.Applied, ApplicationStatus.InProgress, ApplicationStatus.Interview, ApplicationStatus.TaskOrTest];

    internal static async Task<int> GetDaysAsync(AppDbContext db, Guid userId, CancellationToken cancellationToken)
    {
        var json = await db.WorkspaceSections.AsNoTracking()
            .Where(section => section.AppUserId == userId && section.Name == "preferences")
            .Select(section => section.Json).SingleOrDefaultAsync(cancellationToken);
        if (json is null)
            return 7;

        using var preferences = JsonDocument.Parse(json);
        return preferences.RootElement.TryGetProperty("followUpDays", out var value) &&
            value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var days)
            ? Math.Clamp(days, 1, 365) : 7;
    }
}
