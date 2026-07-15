using System;
using System.Collections.Generic;
using System.Text;

using TrackMyCV.Domain.Enums;

namespace TrackMyCV.Application.Applications.DTOs;

public class UpdateJobApplicationDto
{
    public Guid? CompanyId { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty;

    public ApplicationStatus Status { get; set; }

    public DateOnly DateApplied { get; set; }

    public DateOnly? LastContact { get; set; }

    public string NextStep { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public WorkMode WorkMode { get; set; }

    public string Source { get; set; } = string.Empty;

    public string OfferUrl { get; set; } = string.Empty;

    public string Requirements { get; set; } = string.Empty;

    public string Benefits { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    public string CvName { get; set; } = string.Empty;
}