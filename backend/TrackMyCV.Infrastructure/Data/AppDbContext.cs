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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<JobApplication>(entity =>
        {
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
