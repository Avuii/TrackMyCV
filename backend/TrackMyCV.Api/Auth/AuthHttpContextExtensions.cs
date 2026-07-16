namespace TrackMyCV.Api.Auth;

public static class AuthHttpContextExtensions
{
    public const string UserIdItemKey = "TrackMyCV.UserId";
    public const string SessionIdItemKey = "TrackMyCV.SessionId";

    public static Guid? GetCurrentUserId(this HttpContext context)
    {
        return context.Items.TryGetValue(UserIdItemKey, out var value) && value is Guid userId
            ? userId
            : null;
    }

    public static Guid? GetCurrentSessionId(this HttpContext context)
    {
        return context.Items.TryGetValue(SessionIdItemKey, out var value) && value is Guid sessionId
            ? sessionId
            : null;
    }
}
