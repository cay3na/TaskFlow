import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';


@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly API_BASE = 'https://localhost:7001/api/projects';

  constructor(private http: HttpClient) {}

  getTasks(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_BASE}/${projectId}/tasks`);
  }

  createTask(projectId: number, request: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.API_BASE}/${projectId}/tasks`, request);
  }

  updateTask(projectId: number, taskId: number, request: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.API_BASE}/${projectId}/tasks/${taskId}`, request);
  }

  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/${projectId}/tasks/${taskId}`);
  }
}
