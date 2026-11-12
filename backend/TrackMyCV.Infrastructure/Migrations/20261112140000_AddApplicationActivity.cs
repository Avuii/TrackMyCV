using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261112140000_AddApplicationActivity")]
public sealed class AddApplicationActivity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>("WorkspaceCompanyId", "JobApplications", nullable: true);
        migrationBuilder.CreateTable(
            name: "ApplicationActivities",
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                AppUserId = table.Column<Guid>(nullable: false),
                ApplicationId = table.Column<Guid>(nullable: false),
                Company = table.Column<string>(maxLength: 180, nullable: false),
                Position = table.Column<string>(maxLength: 220, nullable: false),
                Kind = table.Column<string>(maxLength: 32, nullable: false),
                Detail = table.Column<string>(maxLength: 220, nullable: false),
                DocumentId = table.Column<Guid>(nullable: true),
                OccurredAtUtc = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ApplicationActivities", row => row.Id);
                table.ForeignKey("FK_ApplicationActivities_AppUsers_AppUserId", row => row.AppUserId,
                    "AppUsers", "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex("IX_ApplicationActivities_AppUserId_ApplicationId_OccurredAtUtc",
            "ApplicationActivities", new[] { "AppUserId", "ApplicationId", "OccurredAtUtc" });
        migrationBuilder.CreateIndex("IX_ApplicationActivities_AppUserId_DocumentId_OccurredAtUtc",
            "ApplicationActivities", new[] { "AppUserId", "DocumentId", "OccurredAtUtc" });
        migrationBuilder.Sql("""
            INSERT INTO ApplicationActivities
                (Id, AppUserId, ApplicationId, Company, Position, Kind, Detail, DocumentId, OccurredAtUtc)
            SELECT NEWID(), application.AppUserId, application.Id, application.CompanyName, application.Position,
                N'document-existing', document.Name, document.Id, SYSUTCDATETIME()
            FROM JobApplications AS application
            INNER JOIN UserDocuments AS document
                ON document.Id = application.DocumentId AND document.AppUserId = application.AppUserId;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("ApplicationActivities");
        migrationBuilder.DropColumn("WorkspaceCompanyId", "JobApplications");
    }
}
