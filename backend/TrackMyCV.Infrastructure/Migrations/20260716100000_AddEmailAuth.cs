using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TrackMyCV.Infrastructure.Data;

#nullable disable

namespace TrackMyCV.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260716100000_AddEmailAuth")]
    public partial class AddEmailAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuthSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuthSessions_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "JobApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Email",
                table: "AppUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_AppUserId",
                table: "AuthSessions",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_TokenHash",
                table: "AuthSessions",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_AppUserId",
                table: "JobApplications",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_AppUsers_AppUserId",
                table: "JobApplications",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_AppUsers_AppUserId",
                table: "JobApplications");

            migrationBuilder.DropTable(
                name: "AuthSessions");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_AppUserId",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "JobApplications");
        }
    }
}
