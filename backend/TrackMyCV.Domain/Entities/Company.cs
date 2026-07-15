using System;
using System.Collections.Generic;
using System.Text;

using TrackMyCV.Domain.Common;

namespace TrackMyCV.Domain.Entities;

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? WebsiteUrl { get; set; }

    public string? LogoUrl { get; set; }

    public string? Location { get; set; }

    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
}