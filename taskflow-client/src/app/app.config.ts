import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';


// appConfig is the Angular 17 way to configure providers (replaces NgModule)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Register the auth interceptor, it will run for every HTTP request
    provideHttpClient(withInterceptors([authInterceptor])),
    // Enable Angular Material animations
    provideAnimations()
  ]
};
