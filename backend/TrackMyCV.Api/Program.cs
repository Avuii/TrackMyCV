using TrackMyCV.Api.Auth;
using TrackMyCV.Api.Ai;
using TrackMyCV.Api.JobScout;
using TrackMyCV.Api.Notifications;
using System.Threading.RateLimiting;
using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Infrastructure;
using TrackMyCV.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<JobScoutService>(client => client.Timeout = TimeSpan.FromSeconds(10));
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("sqlserver");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection("OpenAI"));
builder.Services.PostConfigure<OpenAiOptions>(options =>
{
    options.ApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? options.ApiKey;
    options.Model = Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? options.Model;
});
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddHostedService<NotificationBackgroundService>();
builder.Services.AddScoped<IDocumentTextExtractor, DocumentTextExtractor>();
builder.Services.AddScoped<ICvReviewService, CvReviewService>();
builder.Services.AddScoped<ICoverLetterLatexRenderer, CoverLetterLatexRenderer>();
builder.Services.AddScoped<ICoverLetterGeneratorService, CoverLetterGeneratorService>();
builder.Services.AddHttpClient<IAiProvider, OpenAiProvider>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<System.Collections.Concurrent.ConcurrentDictionary<Guid, string>>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 12,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.AddPolicy("ai", context =>
    {
        var userKey = context.Items.TryGetValue(AuthHttpContextExtensions.UserIdItemKey, out var value) && value is Guid userId
            ? userId.ToString("N")
            : context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(userKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 8,
            Window = TimeSpan.FromMinutes(10),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (IPAddress.TryParse(app.Configuration["ReverseProxy:Address"], out var proxyAddress))
{
    var options = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    };
    options.KnownProxies.Add(proxyAddress);
    app.UseForwardedHeaders(options);
}

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:ApplyMigrations"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception exception)
    {
        app.Logger.LogError(exception, "Unhandled API error.");

        if (context.Response.HasStarted)
        {
            throw;
        }

        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        await Results.Problem(
            title: "Unexpected API error",
            detail: "The request could not be completed. Try again in a moment.",
            statusCode: StatusCodes.Status500InternalServerError)
            .ExecuteAsync(context);
    }
});

app.UseCors("Frontend");

if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseMiddleware<TokenAuthenticationMiddleware>();

app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

public partial class Program;

internal sealed class DatabaseHealthCheck(IServiceScopeFactory scopes) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy();
    }
}
