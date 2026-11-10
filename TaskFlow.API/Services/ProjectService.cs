using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Services;


public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectDto>> GetUserProjectsAsync(int userId)
    {
        return await _context.Projects
            .Where(p => p.OwnerId == userId)
            .Include(p => p.Owner)
            .Include(p => p.Tasks)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                OwnerId = p.OwnerId,
                OwnerName = p.Owner.Name,
                TaskCount = p.Tasks.Count,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(int projectId, int userId)
    {
        return await _context.Projects
            .Where(p => p.Id == projectId && p.OwnerId == userId)
            .Include(p => p.Owner)
            .Include(p => p.Tasks)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                OwnerId = p.OwnerId,
                OwnerName = p.Owner.Name,
                TaskCount = p.Tasks.Count,
                CreatedAt = p.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, int userId)
    {
        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            OwnerId = userId
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var owner = await _context.Users.FindAsync(userId);

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OwnerId = project.OwnerId,
            OwnerName = owner?.Name ?? "",
            TaskCount = 0,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task<ProjectDto> UpdateProjectAsync(int projectId, UpdateProjectDto dto, int userId)
    {
        var project = await _context.Projects
            .Include(p => p.Owner)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId)
            ?? throw new KeyNotFoundException("Project not found or you don't have permission.");

        project.Name = dto.Name;
        project.Description = dto.Description;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OwnerId = project.OwnerId,
            OwnerName = project.Owner.Name,
            TaskCount = project.Tasks.Count,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task DeleteProjectAsync(int projectId, int userId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId)
            ?? throw new KeyNotFoundException("Project not found or you don't have permission.");

        // EF Core tracks this entity as "Deleted", SaveChanges() sends the DELETE query
        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
    }
}
