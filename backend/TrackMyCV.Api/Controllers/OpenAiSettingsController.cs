using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using TrackMyCV.Api.Auth;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/ai/settings")]
public sealed class OpenAiSettingsController(ConcurrentDictionary<Guid, string> keys) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId) return Unauthorized();
        return Ok(new { configured = keys.ContainsKey(userId) });
    }

    [HttpPut]
    public IActionResult Put(OpenAiKeyRequest request)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId) return Unauthorized();

        var key = request.ApiKey?.Trim() ?? string.Empty;
        if (key.Length == 0)
        {
            keys.TryRemove(userId, out _);
            return Ok(new { configured = false });
        }

        if (key.Length > 512 || !key.StartsWith("sk-", StringComparison.Ordinal) ||
            key.Any(character => character <= ' ' || character > '~'))
        {
            return BadRequest("Enter a valid OpenAI API key.");
        }

        keys[userId] = key;
        return Ok(new { configured = true });
    }
}

public sealed record OpenAiKeyRequest(string? ApiKey);
