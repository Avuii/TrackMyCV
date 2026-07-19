using Microsoft.AspNetCore.Mvc;
using TrackMyCV.Api.Auth;
using TrackMyCV.Application.Applications.DTOs;
using TrackMyCV.Application.Applications.Interfaces;
using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/applications")]
public class JobApplicationsController : ControllerBase
{
    private readonly IJobApplicationRepository _repository;

    public JobApplicationsController(IJobApplicationRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobApplicationDto>>> GetAll()
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var applications = await _repository.GetAllAsync(userId.Value);
        var result = applications.Select(MapToDto).ToList();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobApplicationDto>> GetById(Guid id)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _repository.GetByIdAsync(id, userId.Value);

        if (application is null)
        {
            return NotFound();
        }

        return Ok(MapToDto(application));
    }

    [HttpPost]
    public async Task<ActionResult<JobApplicationDto>> Create(CreateJobApplicationDto dto)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        if (ValidateApplication(dto) is { } validationProblem)
        {
            return validationProblem;
        }

        var application = new JobApplication
        {
            AppUserId = userId.Value,
            CompanyId = dto.CompanyId,
            CompanyName = Clean(dto.CompanyName, 180),
            Position = Clean(dto.Position, 220),
            Category = Clean(dto.Category, 100),
            Level = Clean(dto.Level, 80),
            Status = dto.Status,
            DateApplied = dto.DateApplied,
            LastContact = dto.LastContact,
            NextStep = Clean(dto.NextStep, 180),
            Location = Clean(dto.Location, 160),
            WorkMode = dto.WorkMode,
            Source = Clean(dto.Source, 160),
            OfferUrl = Clean(dto.OfferUrl, 700),
            Requirements = Clean(dto.Requirements, 4000),
            Benefits = Clean(dto.Benefits, 4000),
            Notes = Clean(dto.Notes, 6000),
            CvName = Clean(dto.CvName, 180)
        };

        var created = await _repository.CreateAsync(application);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateJobApplicationDto dto)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _repository.GetByIdAsync(id, userId.Value);

        if (application is null)
        {
            return NotFound();
        }

        if (ValidateApplication(dto) is { } validationProblem)
        {
            return validationProblem;
        }

        application.CompanyId = dto.CompanyId;
        application.CompanyName = Clean(dto.CompanyName, 180);
        application.Position = Clean(dto.Position, 220);
        application.Category = Clean(dto.Category, 100);
        application.Level = Clean(dto.Level, 80);
        application.Status = dto.Status;
        application.DateApplied = dto.DateApplied;
        application.LastContact = dto.LastContact;
        application.NextStep = Clean(dto.NextStep, 180);
        application.Location = Clean(dto.Location, 160);
        application.WorkMode = dto.WorkMode;
        application.Source = Clean(dto.Source, 160);
        application.OfferUrl = Clean(dto.OfferUrl, 700);
        application.Requirements = Clean(dto.Requirements, 4000);
        application.Benefits = Clean(dto.Benefits, 4000);
        application.Notes = Clean(dto.Notes, 6000);
        application.CvName = Clean(dto.CvName, 180);

        await _repository.UpdateAsync(application);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _repository.GetByIdAsync(id, userId.Value);

        if (application is null)
        {
            return NotFound();
        }

        await _repository.DeleteAsync(application);

        return NoContent();
    }

    private static JobApplicationDto MapToDto(JobApplication application)
    {
        return new JobApplicationDto
        {
            Id = application.Id,
            CompanyId = application.CompanyId,
            CompanyName = application.CompanyName,
            Position = application.Position,
            Category = application.Category,
            Level = application.Level,
            Status = application.Status,
            DateApplied = application.DateApplied,
            LastContact = application.LastContact,
            NextStep = application.NextStep,
            Location = application.Location,
            WorkMode = application.WorkMode,
            Source = application.Source,
            OfferUrl = application.OfferUrl,
            Requirements = application.Requirements,
            Benefits = application.Benefits,
            Notes = application.Notes,
            CvName = application.CvName,
            CreatedAt = application.CreatedAt,
            UpdatedAt = application.UpdatedAt
        };
    }

    private ActionResult? ValidateApplication(CreateJobApplicationDto dto)
    {
        var errors = ValidateApplicationFields(dto.CompanyName, dto.Position, dto.DateApplied, dto.OfferUrl);

        return errors.Count == 0 ? null : BadRequest(new { message = "Correct the highlighted fields.", errors });
    }

    private ActionResult? ValidateApplication(UpdateJobApplicationDto dto)
    {
        var errors = ValidateApplicationFields(dto.CompanyName, dto.Position, dto.DateApplied, dto.OfferUrl);

        return errors.Count == 0 ? null : BadRequest(new { message = "Correct the highlighted fields.", errors });
    }

    private static List<string> ValidateApplicationFields(string companyName, string position, DateOnly dateApplied, string offerUrl)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(companyName))
        {
            errors.Add("Company name is required.");
        }

        if (string.IsNullOrWhiteSpace(position))
        {
            errors.Add("Position is required.");
        }

        if (dateApplied == default)
        {
            errors.Add("Date applied is required.");
        }

        if (!string.IsNullOrWhiteSpace(offerUrl) &&
            (!Uri.TryCreate(offerUrl.Trim(), UriKind.Absolute, out var uri) ||
             (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
        {
            errors.Add("Offer URL must be a valid http or https URL.");
        }

        return errors;
    }

    private static string Clean(string? value, int maxLength)
    {
        var clean = value?.Trim() ?? string.Empty;

        return clean.Length <= maxLength ? clean : clean[..maxLength];
    }
}
