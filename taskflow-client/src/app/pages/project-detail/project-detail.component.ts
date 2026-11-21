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

  // computed() automatically recalculates when tasks() changes, no manual subscriptions needed
  todoTasks = computed(() => this.tasks().filter(t => t.status === 'Todo'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'InProgress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'Done'));

  createForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
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
    const statusMap: Record<string, number> = {
      'Todo': 0, 'InProgress': 1, 'Done': 2
    };
    this.taskService.updateTask(this.projectId, task.id, {
      title: task.title,
      description: task.description,
      status: statusMap[newStatus] as any,
      assignedToId: task.assignedToId
    }).subscribe({
      next: (updated) => {
        this.tasks.update(list =>
          list.map(t => t.id === updated.id ? updated : t));
      }
    });
  }

  deleteTask(taskId: number): void {
    if (!confirm('Delete this task?')) return;
    this.taskService.deleteTask(this.projectId, taskId).subscribe({
      next: () => this.tasks.update(list => list.filter(t => t.id !== taskId))
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
  }
}
