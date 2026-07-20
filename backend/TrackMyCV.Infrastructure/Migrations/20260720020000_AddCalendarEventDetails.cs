using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TrackMyCV.Infrastructure.Data;

#nullable disable

namespace TrackMyCV.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260720020000_AddCalendarEventDetails")]
    public partial class AddCalendarEventDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationId",
                table: "NotificationCalendarEvents",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "NotificationCalendarEvents",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DetailedPlan",
                table: "NotificationCalendarEvents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "NotificationCalendarEvents",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "NotificationCalendarEvents",
                type: "nvarchar(700)",
                maxLength: 700,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "NotificationCalendarEvents");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "NotificationCalendarEvents");

            migrationBuilder.DropColumn(
                name: "DetailedPlan",
                table: "NotificationCalendarEvents");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "NotificationCalendarEvents");

            migrationBuilder.DropColumn(
                name: "MeetingLink",
                table: "NotificationCalendarEvents");
        }
    }
}
