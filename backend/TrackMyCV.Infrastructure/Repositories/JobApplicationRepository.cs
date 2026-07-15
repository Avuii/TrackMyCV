using System;
using System.Collections.Generic;
using System.Text;

using Microsoft.EntityFrameworkCore;
using TrackMyCV.Application.Applications.Interfaces;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Infrastructure.Repositories;

public class JobApplicationRepository : IJobApplicationRepository
{
    private readonly AppDbContext _context;

    public JobApplicationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobApplication>> GetAllAsync()
    {
        return await _context.JobApplications
            .Include(x => x.Company)
            .OrderByDescending(x => x.DateApplied)
            .ToListAsync();
    }

    public async Task<JobApplication?> GetByIdAsync(Guid id)
    {
        return await _context.JobApplications
            .Include(x => x.Company)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<JobApplication> CreateAsync(JobApplication application)
    {
        _context.JobApplications.Add(application);
        await _context.SaveChangesAsync();

        return application;
    }

    public async Task UpdateAsync(JobApplication application)
    {
        application.UpdatedAt = DateTime.UtcNow;

        _context.JobApplications.Update(application);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(JobApplication application)
    {
        _context.JobApplications.Remove(application);
        await _context.SaveChangesAsync();
    }
}