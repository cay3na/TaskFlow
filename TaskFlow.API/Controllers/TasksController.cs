using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.API.DTOs;
using TaskFlow.API.Services;

namespace TaskFlow.API.Controllers;


[ApiController]
[Route("api/projects/{projectId}/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/projects/5/tasks
    [HttpGet]
    public async Task<IActionResult> GetTasks(int projectId)
    {
        try
        {
            var tasks = await _taskService.GetProjectTasksAsync(projectId, GetUserId());
            return Ok(tasks);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // POST api/projects/5/tasks
    [HttpPost]
    public async Task<IActionResult> CreateTask(int projectId, [FromBody] CreateTaskDto dto)
    {
        try
        {
            var task = await _taskService.CreateTaskAsync(projectId, dto, GetUserId());
            return StatusCode(201, task);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PUT api/projects/5/tasks/3
    [HttpPut("{taskId}")]
    public async Task<IActionResult> UpdateTask(int projectId, int taskId, [FromBody] UpdateTaskDto dto)
    {
        try
        {
            var task = await _taskService.UpdateTaskAsync(taskId, dto, GetUserId());
            return Ok(task);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // DELETE api/projects/5/tasks/3
    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTask(int projectId, int taskId)
    {
        try
        {
            await _taskService.DeleteTaskAsync(taskId, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
