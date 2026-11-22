import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { asUtc } from '../../core/utils/date.util';
 

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatFormFieldModule, 
    MatInputModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
 
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  loading = signal(true);
  showCreateForm = signal(false);
 
  // Edit state
  editingProject = signal(false);                 // true while the project edit form is open
  editingTaskId = signal<number | null>(null);    // id of the task being edited (null = none)
  editError = signal('');                         // red message if saving fails
 
  // Lets the HTML template call asUtc(...) (see core/utils/date.util.ts).
  asUtc = asUtc;
 
  // The backend expects the status as a number (0, 1, 2), not as text
  private readonly statusMap: Record<string, number> = {
    Todo: 0, InProgress: 1, Done: 2
  };
 
  // computed() automatically recalculates when tasks() changes — no manual subscriptions needed
  todoTasks = computed(() => this.tasks().filter(t => t.status === 'Todo'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'InProgress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'Done'));
 
  createForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', Validators.maxLength(2000)]
  });
 
  // Edit forms, Validators.pattern(/\S/) means "must contain at least one non-space character"
  projectEditForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)]
  });
 
  taskEditForm = this.fb.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(300)]],
    description: ['', Validators.maxLength(2000)]
  });
 
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData(id);
  }
 
  loadData(projectId: number): void {
    this.projectService.getProject(projectId).subscribe({
      next: (p) => this.project.set(p),
      error: () => this.router.navigate(['/dashboard'])
    });
    this.taskService.getTasks(projectId).subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
 
  get projectId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }
 
  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
  }
 
  createTask(): void {
    if (this.createForm.invalid) return;
    const { title, description } = this.createForm.value;
    this.taskService.createTask(this.projectId, { title: title!, description: description || '' }).subscribe({
      next: (task) => {
        this.tasks.update(list => [...list, task]);
        this.createForm.reset();
        this.showCreateForm.set(false);
      }
    });
  }
 
  updateStatus(task: Task, newStatus: TaskStatus): void {
    this.taskService.updateTask(this.projectId, task.id, {
      title: task.title,
      description: task.description,
      status: this.statusMap[newStatus] as any,
      assignedToId: task.assignedToId
    }).subscribe({
      next: (updated) => {
        this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
      }
    });
  }
 
  deleteTask(taskId: number): void {
    if (!confirm('Delete this task?')) return;
    this.taskService.deleteTask(this.projectId, taskId).subscribe({
      next: () => this.tasks.update(list => list.filter(t => t.id !== taskId))
    });
  }


  //Edit project
  startEditProject(): void {
    const p = this.project();
    if (!p) return;
    this.editError.set('');
    this.editingTaskId.set(null);   // close any open task editor
    this.projectEditForm.setValue({ name: p.name, description: p.description ?? '' });
    this.editingProject.set(true);
  }
 
  cancelEditProject(): void {
    this.editingProject.set(false);
    this.editError.set('');
  }
 
  saveProject(): void {
    if (this.projectEditForm.invalid) return;
    const { name, description } = this.projectEditForm.value;
    this.projectService.updateProject(this.projectId, {
      name: name!.trim(),
      description: (description ?? '').trim()
    }).subscribe({
      next: (updated) => {
        this.project.set(updated);        // the server sends back the new updatedAt time
        this.editingProject.set(false);
        this.editError.set('');
      },
      error: () => this.editError.set('Could not save the project. Please try again.')
    });
  }
 
  // Edit task
 
  startEditTask(task: Task): void {
    this.editError.set('');
    this.editingProject.set(false);   // close the project editor
    this.taskEditForm.setValue({ title: task.title, description: task.description ?? '' });
    this.editingTaskId.set(task.id);
  }
 
  cancelEditTask(): void {
    this.editingTaskId.set(null);
    this.editError.set('');
  }
 
  saveTask(task: Task): void {
    if (this.taskEditForm.invalid) return;
    const { title, description } = this.taskEditForm.value;
    this.taskService.updateTask(this.projectId, task.id, {
      title: title!.trim(),
      description: (description ?? '').trim(),
      status: this.statusMap[task.status] as any,   // keep the status exactly as it is
      assignedToId: task.assignedToId
    }).subscribe({
      next: (updated) => {
        this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
        this.editingTaskId.set(null);
        this.editError.set('');
      },
      error: () => this.editError.set('Could not save the task. Please try again.')
    });
  }
 
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
