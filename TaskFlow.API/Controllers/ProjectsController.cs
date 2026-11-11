using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.API.DTOs;
using TaskFlow.API.Services;

namespace TaskFlow.API.Controllers;


[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints in this controller require a valid JWT token
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // Helper: Extract the current user's ID from the JWT token claims
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/projects
    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await _projectService.GetUserProjectsAsync(GetUserId());
        return Ok(projects);
    }

    // GET api/projects/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var project = await _projectService.GetProjectByIdAsync(id, GetUserId());
        if (project == null) return NotFound();
        return Ok(project);
    }

    // POST api/projects
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        var project = await _projectService.CreateProjectAsync(dto, GetUserId());
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    // PUT api/projects/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto dto)
    {
        try
        {
            var project = await _projectService.UpdateProjectAsync(id, dto, GetUserId());
            return Ok(project);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // DELETE api/projects/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            await _projectService.DeleteProjectAsync(id, GetUserId());
            return NoContent(); // 204 No Content, successful delete with no response body.
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
