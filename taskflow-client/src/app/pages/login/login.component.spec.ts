import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.model';   
import { NoopAnimationsModule } from '@angular/platform-browser/animations';   


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockAuthResponse: AuthResponse = {
    userId: 1,
    name: 'Test User',
    email: 'a@b.com',
    token: 'fake-jwt-token',
    tokenExpiry: '2026-12-01T00:00:00Z',
  };   

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authSpy },],
    }).compileComponents();   

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as Router;
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the email input', () => {
    expect(fixture.debugElement.query(By.css('input[type="email"]'))).toBeTruthy();
  });

  it('should render the password input', () => {
    expect(fixture.debugElement.query(By.css('input[type="password"]'))).toBeTruthy();
  });

  it('should disable the submit button when the form is invalid', () => {
    const btn = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(btn.disabled).toBeTrue();
  });

  it('should enable the submit button when the form is valid', () => {
    component.loginForm.patchValue({ email: 'a@b.com', password: '123456' });
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(btn.disabled).toBeFalse();
  });

  it('should show "Email is required" when email is empty', () => {
    component.loginForm.get('email')!.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('Email is required'))).toBeTrue();
  });

  it('should call authService.login on valid submit', () => {
    authService.login.and.returnValue(of(mockAuthResponse));
    component.loginForm.patchValue({ email: 'a@b.com', password: '123456' });
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ email: 'a@b.com', password: '123456' });
  });

  it('should navigate to /dashboard on success', () => {
    authService.login.and.returnValue(of(mockAuthResponse));
    component.loginForm.patchValue({ email: 'a@b.com', password: '123456' });
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBeFalse();
  });

  it('should show "Invalid email or password." on 401', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.loginForm.patchValue({ email: 'a@b.com', password: '123456' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Invalid email or password.');
    expect(component.loading).toBeFalse();
  });

  it('should show a generic error on other failures', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 500 })));
    component.loginForm.patchValue({ email: 'a@b.com', password: '123456' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Something went wrong. Please try again.');
  });

  it('should not call login if the form is invalid', () => {
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });
});
