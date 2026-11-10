using TaskFlow.API.DTOs;

namespace TaskFlow.API.Services;


public interface ITaskService
{
    Task<List<TaskDto>> GetProjectTasksAsync(int projectId, int userId);
    Task<TaskDto> CreateTaskAsync(int projectId, CreateTaskDto dto, int userId);
    Task<TaskDto> UpdateTaskAsync(int taskId, UpdateTaskDto dto, int userId);
    Task DeleteTaskAsync(int taskId, int userId);
}
