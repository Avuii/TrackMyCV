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

        var application = new JobApplication
        {
            AppUserId = userId.Value,
            CompanyId = dto.CompanyId,
            CompanyName = dto.CompanyName,
            Position = dto.Position,
            Category = dto.Category,
            Level = dto.Level,
            Status = dto.Status,
            DateApplied = dto.DateApplied,
            LastContact = dto.LastContact,
            NextStep = dto.NextStep,
            Location = dto.Location,
            WorkMode = dto.WorkMode,
            Source = dto.Source,
            OfferUrl = dto.OfferUrl,
            Requirements = dto.Requirements,
            Benefits = dto.Benefits,
            Notes = dto.Notes,
            CvName = dto.CvName
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

        application.CompanyId = dto.CompanyId;
        application.CompanyName = dto.CompanyName;
        application.Position = dto.Position;
        application.Category = dto.Category;
        application.Level = dto.Level;
        application.Status = dto.Status;
        application.DateApplied = dto.DateApplied;
        application.LastContact = dto.LastContact;
        application.NextStep = dto.NextStep;
        application.Location = dto.Location;
        application.WorkMode = dto.WorkMode;
        application.Source = dto.Source;
        application.OfferUrl = dto.OfferUrl;
        application.Requirements = dto.Requirements;
        application.Benefits = dto.Benefits;
        application.Notes = dto.Notes;
        application.CvName = dto.CvName;

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
}
