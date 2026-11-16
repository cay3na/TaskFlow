import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';


// @Injectable({ providedIn: 'root' }) means this service is a singleton
// there is ONE instance shared across the entire application
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'https://localhost:7001/api/auth';

  // Signal, Angular 17's reactive primitive (like a reactive variable)
  // Any component reading currentUser() will automatically update when it changes
  readonly currentUser = signal<AuthResponse | null>(null);

  constructor(private http: HttpClient) {
    // Restore user session from localStorage on app startup
    const stored = localStorage.getItem('taskflow_user');
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
      // tap() runs a side effect without changing the stream value
      tap(response => this.storeUser(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.storeUser(response))
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('taskflow_user');
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  private storeUser(response: AuthResponse): void {
    localStorage.setItem('taskflow_user', JSON.stringify(response));
    this.currentUser.set(response);
  }
}
