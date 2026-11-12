namespace TrackMyCV.Domain.Entities;

public sealed class WorkspaceSection
{
    public Guid AppUserId { get; set; }
    public string Name { get; set; } = "";
    public string Json { get; set; } = "";
    public Guid Revision { get; set; }
}
