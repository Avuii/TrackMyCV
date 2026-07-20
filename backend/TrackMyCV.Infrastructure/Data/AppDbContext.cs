using System;
using System.Collections.Generic;
using System.Text;

using Microsoft.EntityFrameworkCore;
using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();

    public DbSet<Company> Companies => Set<Company>();

    public DbSet<AppUser> AppUsers => Set<AppUser>();

    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    public DbSet<UserDocument> UserDocuments => Set<UserDocument>();

    public DbSet<UserNotificationSettings> UserNotificationSettings => Set<UserNotificationSettings>();

    public DbSet<NotificationCalendarEvent> NotificationCalendarEvents => Set<NotificationCalendarEvent>();

    public DbSet<NotificationEmailLog> NotificationEmailLogs => Set<NotificationEmailLog>();

    public DbSet<CvReview> CvReviews => Set<CvReview>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.Applications)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.CompanyName)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.Position)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.Category)
                .HasMaxLength(100);

            entity.Property(x => x.Level)
                .HasMaxLength(80);

            entity.Property(x => x.Location)
                .HasMaxLength(160);

            entity.Property(x => x.Source)
                .HasMaxLength(160);

            entity.Property(x => x.OfferUrl)
                .HasMaxLength(700);

            entity.Property(x => x.CvName)
                .HasMaxLength(180);
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.Property(x => x.Email)
                .HasMaxLength(320)
                .IsRequired();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.DisplayName)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .HasMaxLength(512)
                .IsRequired();
        });

        modelBuilder.Entity<AuthSession>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.AuthSessions)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.TokenHash)
                .HasMaxLength(128)
                .IsRequired();

            entity.HasIndex(x => x.TokenHash)
                .IsUnique();

            entity.HasIndex(x => x.AppUserId);
        });

        modelBuilder.Entity<UserDocument>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.Name)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.Type)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.Category)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.OriginalFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(x => x.StoredFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(x => x.ContentType)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.RelativePath)
                .HasMaxLength(700)
                .IsRequired();

            entity.Property(x => x.Url)
                .HasMaxLength(700)
                .IsRequired();

            entity.Property(x => x.Language)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.TargetRole)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(x => x.AppUserId);
        });

        modelBuilder.Entity<CvReview>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.CvReviews)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Document)
                .WithMany()
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(x => x.DocumentName)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.ReviewType)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(x => x.Language)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(x => x.JobTitle)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.ExperienceLevel)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.ResultJson)
                .IsRequired();

            entity.Property(x => x.ErrorMessage)
                .HasMaxLength(700)
                .IsRequired();

            entity.HasIndex(x => x.AppUserId);
            entity.HasIndex(x => x.DocumentId);
        });

        modelBuilder.Entity<UserNotificationSettings>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithOne(x => x.NotificationSettings)
                .HasForeignKey<UserNotificationSettings>(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.Email)
                .HasMaxLength(320)
                .IsRequired();

            entity.Property(x => x.ReminderTime)
                .HasMaxLength(80)
                .IsRequired();

            entity.HasIndex(x => x.AppUserId)
                .IsUnique();
        });

        modelBuilder.Entity<NotificationCalendarEvent>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.NotificationCalendarEvents)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.ClientEventId)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.Title)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.Company)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.ApplicationId)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.EventType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Location)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.MeetingLink)
                .HasMaxLength(700)
                .IsRequired();

            entity.Property(x => x.DetailedPlan)
                .IsRequired();

            entity.Property(x => x.Icon)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.Color)
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(x => new { x.AppUserId, x.ClientEventId })
                .IsUnique();
        });

        modelBuilder.Entity<NotificationEmailLog>(entity =>
        {
            entity.HasOne(x => x.AppUser)
                .WithMany(x => x.NotificationEmailLogs)
                .HasForeignKey(x => x.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.NotificationType)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.NotificationKey)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.RecipientEmail)
                .HasMaxLength(320)
                .IsRequired();

            entity.Property(x => x.Subject)
                .HasMaxLength(240)
                .IsRequired();

            entity.HasIndex(x => new { x.AppUserId, x.NotificationType, x.NotificationKey })
                .IsUnique();
        });

        modelBuilder.Entity<Company>(entity =>
        {
            entity.Property(x => x.Name)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.WebsiteUrl)
                .HasMaxLength(700);

            entity.Property(x => x.LogoUrl)
                .HasMaxLength(700);

            entity.Property(x => x.Location)
                .HasMaxLength(160);
        });
    }
}
