namespace TrackMyCV.Api.Ai;

public interface IAiProvider
{
    Task<TResponse> GenerateStructuredResponseAsync<TResponse>(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken);
}
