using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Services;


public class TaskService : ITaskService
{
    private readonly AppDbContext _context;

    public TaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskDto>> GetProjectTasksAsync(int projectId, int userId)
    {
        // Verify the user owns this project before showing tasks
        bool projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId && p.OwnerId == userId);

        if (!projectExists)
            throw new KeyNotFoundException("Project not found.");

        return await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.AssignedTo)
            .OrderBy(t => t.Status)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status.ToString(),
                ProjectId = t.ProjectId,
                AssignedToId = t.AssignedToId,
                AssignedToName = t.AssignedTo != null ? t.AssignedTo.Name : null,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<TaskDto> CreateTaskAsync(int projectId, CreateTaskDto dto, int userId)
    {
        bool projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId && p.OwnerId == userId);

        if (!projectExists)
            throw new KeyNotFoundException("Project not found.");

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            ProjectId = projectId,
            AssignedToId = dto.AssignedToId,
            Status = Models.TaskStatus.Todo
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        string? assignedName = null;
        if (dto.AssignedToId.HasValue)
        {
            var assignedUser = await _context.Users.FindAsync(dto.AssignedToId.Value);
            assignedName = assignedUser?.Name;
        }

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status.ToString(),
            ProjectId = task.ProjectId,
            AssignedToId = task.AssignedToId,
            AssignedToName = assignedName,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }

    public async Task<TaskDto> UpdateTaskAsync(int taskId, UpdateTaskDto dto, int userId)
    {
        // Join Tasks with Projects to verify ownership in one query
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.OwnerId == userId)
            ?? throw new KeyNotFoundException("Task not found or access denied.");

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.AssignedToId = dto.AssignedToId;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        string? assignedName = null;
        if (dto.AssignedToId.HasValue)
        {
            var assignedUser = await _context.Users.FindAsync(dto.AssignedToId.Value);
            assignedName = assignedUser?.Name;
        }

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status.ToString(),
            ProjectId = task.ProjectId,
            AssignedToId = task.AssignedToId,
            AssignedToName = assignedName,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }

    public async Task DeleteTaskAsync(int taskId, int userId)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.OwnerId == userId)
            ?? throw new KeyNotFoundException("Task not found or access denied.");

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
    }
}
