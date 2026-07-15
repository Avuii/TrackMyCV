using System;
using System.Collections.Generic;
using System.Text;

namespace TrackMyCV.Domain.Enums;

public enum ApplicationStatus
{
    Saved = 0,
    Applied = 1,
    InProgress = 2,
    Interview = 3,
    TaskOrTest = 4,
    Offer = 5,
    Rejected = 6,
    NoResponse = 7,
    Ghosted = 8,
    Archived = 9
}