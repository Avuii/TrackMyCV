namespace TrackMyCV.Api.Ai;

public record CvReviewRequest(
    Guid DocumentId,
    string ReviewType,
    string Language,
    string? JobTitle,
    string? ExperienceLevel,
    string? JobDescription);

public record CvReviewDto(
    Guid Id,
    Guid DocumentId,
    string DocumentName,
    string ReviewType,
    string Language,
    string JobTitle,
    string ExperienceLevel,
    string Status,
    int? OverallScore,
    int? JobMatchScore,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    CvReviewResult? Result,
    string? ErrorMessage);

public record CvReviewResult(
    int OverallScore,
    string Summary,
    string[] Strengths,
    CvIssue[] Issues,
    CategoryScore[] CategoryScores,
    AtsCompatibility AtsCompatibility,
    string[] MissingKeywords,
    SectionReview[] SectionReviews,
    string[] RecommendedActions,
    int? JobMatchScore);

public record CvIssue(string Priority, string Title, string Description, string Section, string SuggestedFix);

public record CategoryScore(string Name, int Score, string Note);

public record AtsCompatibility(int Score, string Summary, string[] Improvements);

public record SectionReview(string Section, int Score, string Summary, string[] Suggestions);

public record CoverLetterGenerateRequest(
    Guid DocumentId,
    string CompanyName,
    string JobTitle,
    string JobDescription,
    string Language,
    string Tone,
    string Length,
    string? AdditionalContext);

public record CoverLetterGenerateResponse(
    string CoverLetter,
    string SuggestedFileName,
    string[] Warnings);
