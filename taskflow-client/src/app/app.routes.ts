import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';


// Routes define the URL to component mapping
// Lazy loading (loadComponent) means the component's code is only loaded when needed
// making the initial bundle smaller and the app faster
export const routes: Routes = [
  // Public routes, no auth required
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // Protected routes, authGuard checks if user is logged in
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    canActivate: [authGuard]
  },

  // Default redirect
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
