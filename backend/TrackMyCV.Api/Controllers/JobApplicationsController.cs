using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Infrastructure.Data;
using TrackMyCV.Api.Auth;
using TrackMyCV.Api.Notifications;
using TrackMyCV.Application.Applications.DTOs;
using TrackMyCV.Application.Applications.Interfaces;
using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/applications")]
public class JobApplicationsController : ControllerBase
{
    private readonly IJobApplicationRepository _repository;

    private readonly AppDbContext _db;

    public JobApplicationsController(IJobApplicationRepository repository, AppDbContext db)
    {
        _repository = repository;
        _db = db;
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

        var document = dto.DocumentId is Guid documentId
            ? await _db.UserDocuments.AsNoTracking().FirstOrDefaultAsync(item => item.Id == documentId && item.AppUserId == userId.Value)
            : null;
        if (dto.DocumentId.HasValue && document is null)
            return BadRequest(new { message = "Select a document from your workspace." });

        var application = new JobApplication
        {
            AppUserId = userId.Value,
            CompanyId = dto.CompanyId,
            WorkspaceCompanyId = dto.WorkspaceCompanyId,
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
            DocumentId = document?.Id,
            CvName = Clean(document?.Name ?? dto.CvName, 180)
        };

        if (document is not null)
            _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "document-linked", document.Name, document.Id));
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

        var document = dto.DocumentId is Guid documentId
            ? await _db.UserDocuments.AsNoTracking().FirstOrDefaultAsync(item => item.Id == documentId && item.AppUserId == userId.Value)
            : null;
        if (dto.DocumentId.HasValue && document is null)
            return BadRequest(new { message = "Select a document from your workspace." });

        var previousStatus = application.Status;
        var previousContact = application.LastContact;
        var previousStep = application.NextStep;
        var previousDocumentId = application.DocumentId;
        var previousDocumentName = application.CvName;
        application.CompanyId = dto.CompanyId;
        application.WorkspaceCompanyId = dto.WorkspaceCompanyId;
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
        application.DocumentId = document?.Id;
        application.CvName = Clean(document?.Name ?? dto.CvName, 180);

        if (previousStatus != application.Status)
            _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "status", application.Status.ToString()));
        if (previousContact != application.LastContact)
            _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "contact", application.LastContact?.ToString("yyyy-MM-dd") ?? ""));
        if (previousStep != application.NextStep)
            _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "next-step", application.NextStep));
        if (previousDocumentId != application.DocumentId)
        {
            if (previousDocumentId.HasValue)
                _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "document-unlinked", previousDocumentName, previousDocumentId));
            if (document is not null)
                _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "document-linked", document.Name, document.Id));
        }

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

        if (application.DocumentId is Guid documentId)
            _db.ApplicationActivities.Add(ApplicationActivity.Record(application, userId.Value, "application-deleted", application.CvName, documentId));
        await _repository.DeleteAsync(application);

        return NoContent();
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid id, CancellationToken cancellationToken)
    {
        if (HttpContext.GetCurrentUserId() is not Guid userId)
            return Unauthorized();

        var application = await _db.JobApplications.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id && item.AppUserId == userId, cancellationToken);
        if (application is null)
            return NotFound();

        var activity = await _db.ApplicationActivities.AsNoTracking()
            .Where(item => item.AppUserId == userId && item.ApplicationId == id)
            .OrderByDescending(item => item.OccurredAtUtc).ThenBy(item => item.Id).Take(100)
            .Select(item => new { item.Id, item.Kind, item.Detail, item.OccurredAtUtc })
            .ToListAsync(cancellationToken);
        DateOnly? followUpDueOn = null;
        if (FollowUpPolicy.ActiveStatuses.Contains(application.Status))
        {
            var days = await FollowUpPolicy.GetDaysAsync(_db, userId, cancellationToken);
            followUpDueOn = (application.LastContact ?? application.DateApplied).AddDays(days);
        }
        return Ok(new { application.CreatedAt, Activity = activity, FollowUpDueOn = followUpDueOn });
    }

    private static JobApplicationDto MapToDto(JobApplication application)
    {
        return new JobApplicationDto
        {
            Id = application.Id,
            CompanyId = application.CompanyId,
            WorkspaceCompanyId = application.WorkspaceCompanyId,
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
            DocumentId = application.DocumentId,
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
