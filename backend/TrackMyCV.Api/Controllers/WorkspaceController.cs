using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/workspace")]
public sealed class WorkspaceController(AppDbContext db) : ControllerBase
{
    private static readonly Dictionary<string, JsonValueKind> Shapes = new(StringComparer.Ordinal)
    {
        ["companies"] = JsonValueKind.Array,
        ["notes"] = JsonValueKind.Array,
        ["preferences"] = JsonValueKind.Object,
        ["scout"] = JsonValueKind.Object,
        ["preparation"] = JsonValueKind.Object
    };

    [HttpGet("{name}")]
    public async Task<IActionResult> Get(string name, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();
        if (!Shapes.ContainsKey(name))
            return NotFound();

        var section = await db.WorkspaceSections.FindAsync([userId, name], cancellationToken);
        return Ok(section is null ? new Snapshot(null, null) :
            new Snapshot(section.Revision, JsonSerializer.Deserialize<JsonElement>(section.Json)));
    }

    [HttpPut("{name}")]
    [RequestSizeLimit(24 * 1024 * 1024)]
    public async Task<IActionResult> Put(string name, Snapshot request, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();
        if (name == "scout" || !Shapes.TryGetValue(name, out var shape))
            return NotFound();
        if (request.Data is not JsonElement data || data.ValueKind != shape)
            return BadRequest(new { message = "Invalid workspace data." });

        var json = data.GetRawText();
        var section = await db.WorkspaceSections.FindAsync([userId, name], cancellationToken);
        if (section?.Json == json)
            return Ok(new Snapshot(section.Revision, data));
        if (section?.Revision != request.Revision)
            return Conflict(new { message = "This section changed on another device. Reload before retrying." });

        var creating = section is null;
        if (section is null)
        {
            section = new WorkspaceSection { AppUserId = userId, Name = name };
            db.WorkspaceSections.Add(section);
        }

        section.Json = json;
        section.Revision = Guid.NewGuid();
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "This section changed on another device. Reload before retrying." });
        }
        catch (DbUpdateException exception) when (creating &&
            exception.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "This section changed on another device. Reload before retrying." });
        }

        return Ok(new Snapshot(section.Revision, data));
    }

    public record Snapshot(Guid? Revision, JsonElement? Data);
}
