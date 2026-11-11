using TaskFlow.API.DTOs;

namespace TaskFlow.API.Services;


public interface IProjectService
{
    Task<List<ProjectDto>> GetUserProjectsAsync(int userId);
    Task<ProjectDto?> GetProjectByIdAsync(int projectId, int userId);
    Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, int userId);
    Task<ProjectDto> UpdateProjectAsync(int projectId, UpdateProjectDto dto, int userId);
    Task DeleteProjectAsync(int projectId, int userId);
}