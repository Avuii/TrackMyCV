using Microsoft.EntityFrameworkCore;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Auth;

public class TokenAuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public TokenAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        var authorization = context.Request.Headers.Authorization.ToString();

        if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authorization["Bearer ".Length..].Trim();
            var tokenHash = AuthTokenService.HashToken(token);
            var now = DateTime.UtcNow;

            var session = await dbContext.AuthSessions
                .AsTracking()
                .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.RevokedAt == null && x.ExpiresAt > now);

            if (session is not null)
            {
                session.LastUsedAt = now;
                context.Items[AuthHttpContextExtensions.UserIdItemKey] = session.AppUserId;
                context.Items[AuthHttpContextExtensions.SessionIdItemKey] = session.Id;
                await dbContext.SaveChangesAsync();
            }
        }

        await _next(context);
    }
}
