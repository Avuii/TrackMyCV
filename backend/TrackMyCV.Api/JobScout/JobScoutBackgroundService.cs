namespace TrackMyCV.Api.JobScout;

public sealed class JobScoutBackgroundService(IServiceScopeFactory scopes, TimeProvider clock,
    ILogger<JobScoutBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5), clock);
        try
        {
            do
            {
                try
                {
                    await ScanAsync(stoppingToken);
                }
                catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
                {
                    logger.LogError(exception, "Could not scan scheduled Job Scout searches.");
                }
            } while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    internal async Task ScanAsync(CancellationToken token)
    {
        await using var scope = scopes.CreateAsyncScope();
        var due = await scope.ServiceProvider.GetRequiredService<JobScoutWorkspace>().DueUsersAsync(token);
        foreach (var userId in due)
        {
            await using var userScope = scopes.CreateAsyncScope();
            try
            {
                await userScope.ServiceProvider.GetRequiredService<JobScoutWorkspace>().SearchAsync(userId, null, token);
            }
            catch (Exception exception) when (!token.IsCancellationRequested)
            {
                logger.LogWarning(exception, "A scheduled Job Scout search could not be completed.");
            }
        }
    }
}
