using System;
using System.Collections.Generic;
using System.Text;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TrackMyCV.Application.Applications.Interfaces;
using TrackMyCV.Infrastructure.Data;
using TrackMyCV.Infrastructure.Repositories;

namespace TrackMyCV.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
        });

        services.AddScoped<IJobApplicationRepository, JobApplicationRepository>();

        return services;
    }
}