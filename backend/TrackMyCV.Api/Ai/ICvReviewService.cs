namespace TrackMyCV.Api.Ai;

public interface ICvReviewService
{
    Task<CvReviewDto> CreateReviewAsync(Guid userId, CvReviewRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CvReviewDto>> GetReviewsAsync(Guid userId, CancellationToken cancellationToken);

    Task<CvReviewDto?> GetReviewAsync(Guid userId, Guid reviewId, CancellationToken cancellationToken);

    Task<bool> DeleteReviewAsync(Guid userId, Guid reviewId, CancellationToken cancellationToken);
}
