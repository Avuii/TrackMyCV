using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Api.Ai;

public interface IDocumentTextExtractor
{
    Task<ExtractedDocumentText> ExtractTextAsync(UserDocument document, CancellationToken cancellationToken);
}

public sealed record ExtractedDocumentText(string Text, string Format);
