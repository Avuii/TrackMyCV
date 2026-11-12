using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261112090000_AddWorkspaceAndDocumentLinks")]
public sealed class AddWorkspaceAndDocumentLinks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "WorkspaceSections",
            columns: table => new
            {
                AppUserId = table.Column<Guid>(nullable: false),
                Name = table.Column<string>(maxLength: 80, nullable: false),
                Json = table.Column<string>(nullable: false),
                Revision = table.Column<Guid>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WorkspaceSections", row => new { row.AppUserId, row.Name });
                table.ForeignKey("FK_WorkspaceSections_AppUsers_AppUserId", row => row.AppUserId,
                    "AppUsers", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.AddColumn<Guid>("DocumentId", "JobApplications", nullable: true);
        migrationBuilder.Sql("""
            UPDATE application SET DocumentId = matched.Id
            FROM JobApplications AS application
            CROSS APPLY (
                SELECT TOP (1) document.Id, COUNT(*) OVER () AS MatchCount
                FROM UserDocuments AS document
                WHERE document.AppUserId = application.AppUserId
                  AND document.Name = application.CvName AND document.Type = 'CV'
            ) AS matched
            WHERE application.CvName <> '' AND matched.MatchCount = 1;
            """);
        migrationBuilder.CreateIndex("IX_JobApplications_DocumentId", "JobApplications", "DocumentId");
        migrationBuilder.AddForeignKey("FK_JobApplications_UserDocuments_DocumentId",
            "JobApplications", "DocumentId", "UserDocuments", principalColumn: "Id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_JobApplications_UserDocuments_DocumentId", "JobApplications");
        migrationBuilder.DropIndex("IX_JobApplications_DocumentId", "JobApplications");
        migrationBuilder.DropColumn("DocumentId", "JobApplications");
        migrationBuilder.DropTable("WorkspaceSections");
    }
}
