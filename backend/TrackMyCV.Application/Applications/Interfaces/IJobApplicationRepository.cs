using System;
using System.Collections.Generic;
using System.Text;

using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Application.Applications.Interfaces;

public interface IJobApplicationRepository
{
    Task<List<JobApplication>> GetAllAsync();

    Task<JobApplication?> GetByIdAsync(Guid id);

    Task<JobApplication> CreateAsync(JobApplication application);

    Task UpdateAsync(JobApplication application);

    Task DeleteAsync(JobApplication application);
}
