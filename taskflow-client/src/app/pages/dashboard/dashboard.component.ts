import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-dashboard',
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // OnInit lifecycle hook, ngOnInit() runs after Angular creates the component
  // Used for initialization logic (like loading data from the API)

  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals for reactive state management
  projects = signal<Project[]>([]);
  loading = signal(true);
  showCreateForm = signal(false);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)]
  });

  get userName(): string {
    return this.authService.currentUser()?.name ?? 'User';
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) this.createForm.reset();
  }

  createProject(): void {
    if (this.createForm.invalid) return;
    const { name, description } = this.createForm.value;
    this.projectService.createProject({ name: name!, description: description || '' }).subscribe({
      next: (project) => {
        this.projects.update(list => [...list, project]);
        this.toggleCreateForm();
      }
    });
  }

  deleteProject(event: Event, id: number): void {
    event.stopPropagation(); // Prevent click from opening the project
    if (!confirm('Delete this project? All its tasks will be deleted too.')) return;
    this.projectService.deleteProject(id).subscribe({
      next: () => this.projects.update(list => list.filter(p => p.id !== id))
    });
  }
}

