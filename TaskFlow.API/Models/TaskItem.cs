namespace TaskFlow.API.Models;


public enum TaskStatus
{
    Todo = 0,
    InProgress = 1,
    Done = 2
}

public class TaskItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public TaskStatus Status { get; set; } = TaskStatus.Todo;

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
}
