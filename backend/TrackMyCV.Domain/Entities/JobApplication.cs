using System;
using System.Collections.Generic;
using System.Text;

using TrackMyCV.Domain.Common;
using TrackMyCV.Domain.Enums;

namespace TrackMyCV.Domain.Entities;

public class JobApplication : BaseEntity
{
    public Guid? AppUserId { get; set; }

    public AppUser? AppUser { get; set; }

    public Guid? CompanyId { get; set; }

    public Company? Company { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty;

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Saved;

    public DateOnly DateApplied { get; set; }

    public DateOnly? LastContact { get; set; }

    public string NextStep { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public WorkMode WorkMode { get; set; } = WorkMode.Remote;

    public string Source { get; set; } = string.Empty;

    public string OfferUrl { get; set; } = string.Empty;

    public string Requirements { get; set; } = string.Empty;

    public string Benefits { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    public string CvName { get; set; } = string.Empty;
}
