using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AuthController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);

        if (!IsValidEmail(email))
        {
            return BadRequest("Enter a valid email address.");
        }

        if (request.Password.Length < 8)
        {
            return BadRequest("Password must have at least 8 characters.");
        }

        if (await _dbContext.AppUsers.AnyAsync(x => x.Email == email))
        {
            return Conflict("An account with this email already exists.");
        }

        var user = new AppUser
        {
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? email.Split('@')[0] : request.DisplayName.Trim(),
            PasswordHash = AuthTokenService.HashPassword(request.Password)
        };

        _dbContext.AppUsers.Add(user);
        await _dbContext.SaveChangesAsync();

        return Ok(await CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var user = await _dbContext.AppUsers.FirstOrDefaultAsync(x => x.Email == email);

        if (user is null || !AuthTokenService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(await CreateAuthResponse(user));
    }

    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>> Me()
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _dbContext.AppUsers.FindAsync(userId.Value);

        return user is null ? Unauthorized() : Ok(MapUser(user));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var sessionId = HttpContext.GetCurrentSessionId();

        if (sessionId is not null)
        {
            var session = await _dbContext.AuthSessions.FindAsync(sessionId.Value);

            if (session is not null)
            {
                session.RevokedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }
        }

        return NoContent();
    }

    private async Task<AuthResponse> CreateAuthResponse(AppUser user)
    {
        var token = AuthTokenService.CreateToken();
        var session = new AuthSession
        {
            AppUserId = user.Id,
            TokenHash = AuthTokenService.HashToken(token),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _dbContext.AuthSessions.Add(session);
        await _dbContext.SaveChangesAsync();

        return new AuthResponse(token, MapUser(user));
    }

    private static AuthUserDto MapUser(AppUser user)
    {
        return new AuthUserDto(user.Id, user.Email, user.DisplayName);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

public record RegisterRequest(string Email, string Password, string DisplayName);

public record LoginRequest(string Email, string Password);

public record AuthUserDto(Guid Id, string Email, string DisplayName);

public record AuthResponse(string Token, AuthUserDto User);
