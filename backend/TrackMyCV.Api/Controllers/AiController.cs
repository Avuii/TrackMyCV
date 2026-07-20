using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TrackMyCV.Api.Ai;
using TrackMyCV.Api.Auth;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly ICvReviewService _cvReviewService;
    private readonly ICoverLetterGeneratorService _coverLetterGeneratorService;

    public AiController(ICvReviewService cvReviewService, ICoverLetterGeneratorService coverLetterGeneratorService)
    {
        _cvReviewService = cvReviewService;
        _coverLetterGeneratorService = coverLetterGeneratorService;
    }

    [HttpPost("cv-reviews")]
    [EnableRateLimiting("ai")]
    public async Task<ActionResult<CvReviewDto>> CreateCvReview(CvReviewRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await _cvReviewService.CreateReviewAsync(userId.Value, request, cancellationToken));
        }
        catch (AiOperationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (AiProviderException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, exception.Message);
        }
        catch (DocumentTextExtractionException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpGet("cv-reviews")]
    public async Task<ActionResult<IReadOnlyList<CvReviewDto>>> GetCvReviews(CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        return Ok(await _cvReviewService.GetReviewsAsync(userId.Value, cancellationToken));
    }

    [HttpGet("cv-reviews/{id:guid}")]
    public async Task<ActionResult<CvReviewDto>> GetCvReview(Guid id, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var review = await _cvReviewService.GetReviewAsync(userId.Value, id, cancellationToken);

        return review is null ? NotFound() : Ok(review);
    }

    [HttpDelete("cv-reviews/{id:guid}")]
    public async Task<IActionResult> DeleteCvReview(Guid id, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        return await _cvReviewService.DeleteReviewAsync(userId.Value, id, cancellationToken)
            ? NoContent()
            : NotFound();
    }

    [HttpPost("cover-letters/generate")]
    [EnableRateLimiting("ai")]
    public async Task<ActionResult<CoverLetterGenerateResponse>> GenerateCoverLetter(CoverLetterGenerateRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await _coverLetterGeneratorService.GenerateAsync(userId.Value, request, cancellationToken));
        }
        catch (AiOperationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (AiProviderException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, exception.Message);
        }
        catch (DocumentTextExtractionException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (CoverLetterRenderException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, exception.Message);
        }
    }

    [HttpPost("cover-letters/render")]
    [EnableRateLimiting("ai")]
    public async Task<ActionResult<CoverLetterGenerateResponse>> RenderCoverLetter(CoverLetterRenderRequest request, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await _coverLetterGeneratorService.RenderAsync(request, cancellationToken));
        }
        catch (AiOperationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (CoverLetterRenderException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, exception.Message);
        }
    }
}
