import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../models/project.model';


@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly API_URL = 'https://localhost:7001/api/projects';

  constructor(private http: HttpClient) {}

  // Observable<Project[]>, an async stream that will emit the array when the HTTP call completes
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.API_URL);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.API_URL}/${id}`);
  }

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.API_URL, request);
  }

  updateProject(id: number, request: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.API_URL}/${id}`, request);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
