namespace TrackMyCV.Api.Ai;

public interface ICoverLetterGeneratorService
{
    Task<CoverLetterGenerateResponse> GenerateAsync(Guid userId, CoverLetterGenerateRequest request, CancellationToken cancellationToken);
}
