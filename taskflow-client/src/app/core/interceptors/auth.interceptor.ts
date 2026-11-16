import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';


// An Interceptor intercepts every HTTP request/response
// This one automatically attaches the JWT token to every outgoing request
// Without this, we'd have to manually add headers to every HTTP call
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    // Clone the request (HTTP requests are immutable) and add the Authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // No token? Send the original request unchanged (... for /login and /register)
  return next(req);
};
