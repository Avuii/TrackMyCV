using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.Notifications;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/inbox")]
public sealed class InboxController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? today, TimeOnly? time, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();

        var now = DateTime.UtcNow;
        var date = today ?? DateOnly.FromDateTime(now);
        if (Math.Abs(date.DayNumber - DateOnly.FromDateTime(now).DayNumber) > 1)
            return BadRequest();
        var clock = date.ToDateTime(time ?? TimeOnly.FromDateTime(now));
        var events = await db.NotificationCalendarEvents
            .Where(item => item.AppUserId == userId && item.EventDate >= date && item.EventDate <= date.AddDays(1))
            .ToListAsync(cancellationToken);
        var applications = await db.JobApplications
            .Where(item => item.AppUserId == userId && FollowUpPolicy.ActiveStatuses.Contains(item.Status))
            .ToListAsync(cancellationToken);
        var days = await FollowUpPolicy.GetDaysAsync(db, userId, cancellationToken);

        var messages = events.Where(item => item.EventDate.ToDateTime(item.StartTime) is var start
                && start >= clock && start <= clock.AddDays(1))
            .Select(item => new Message($"event-{item.Id:N}-{item.EventDate:yyyyMMdd}-{item.StartTime:HHmm}",
                item.Title, $"{item.Company} · {item.EventDate:yyyy-MM-dd} {item.StartTime:HH:mm}", "calendar", null))
            .Concat(applications.Where(item => (item.LastContact ?? item.DateApplied) <= date.AddDays(-days))
                .OrderByDescending(item => item.LastContact ?? item.DateApplied)
                .Select(item => new Message($"followup-{item.Id:N}-{item.LastContact ?? item.DateApplied:yyyyMMdd}",
                    $"Follow up with {item.CompanyName}", item.Position, "applications", item.Id)))
            .Take(100).ToArray();
        var receipts = messages.Select(message => "read:" + message.Id).ToArray();
        var read = (await db.WorkspaceSections.Where(item => item.AppUserId == userId && receipts.Contains(item.Name))
            .Select(item => item.Name).ToListAsync(cancellationToken)).ToHashSet();
        return Ok(messages.Select(item => new { item.Id, item.Title, item.Detail, item.Page, item.ApplicationId, Read = read.Contains("read:" + item.Id) }));
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> Read(string id, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();
        if (id.Length > 72 || !(id.StartsWith("event-") || id.StartsWith("followup-")) ||
            !id.All(character => char.IsAsciiLetterOrDigit(character) || character == '-'))
            return BadRequest();

        var key = "read:" + id;
        if (await db.WorkspaceSections.FindAsync([userId, key], cancellationToken) is null)
        {
            db.WorkspaceSections.Add(new WorkspaceSection { AppUserId = userId, Name = key, Json = "true", Revision = Guid.NewGuid() });
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when
                (exception.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 })
            {
                // Another request already marked this notification as read.
            }
        }

        return NoContent();
    }

    private record Message(string Id, string Title, string Detail, string Page, Guid? ApplicationId);
}
