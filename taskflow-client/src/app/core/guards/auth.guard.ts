import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


// A Guard controls whether a route can be activated
// This one protects routes that require the user to be logged in
// If the user is not logged in, they are redirected to /login
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Allow navigation
  }

  // Redirect to login page
  return router.createUrlTree(['/login']);
};
