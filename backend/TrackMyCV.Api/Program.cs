using TrackMyCV.Api.Auth;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Infrastructure;
using TrackMyCV.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);

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

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseSwagger();
app.UseSwaggerUI();

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

app.UseHttpsRedirection();

app.UseMiddleware<TokenAuthenticationMiddleware>();

app.MapControllers();

app.Run();
