import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';


describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
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
    const authSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as Router;
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the name input', () => {
    expect(fixture.debugElement.query(By.css('input[formcontrolname="name"]'))).toBeTruthy();
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
    component.registerForm.patchValue({ name: 'Jane Smith', email: 'a@b.com', password: '123456' });
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(btn.disabled).toBeFalse();
  });

  it('should show "Name is required" when name is empty', () => {
    component.registerForm.get('name')!.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('Name is required'))).toBeTrue();
  });

  it('should show "Email is required" when email is empty', () => {
    component.registerForm.get('email')!.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('Email is required'))).toBeTrue();
  });

  it('should show "Enter a valid email" when the email format is invalid', () => {
    const emailControl = component.registerForm.get('email')!;
    emailControl.setValue('not-an-email');
    emailControl.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('Enter a valid email'))).toBeTrue();
  });

  it('should show "Password is required" when password is empty', () => {
    component.registerForm.get('password')!.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('Password is required'))).toBeTrue();
  });

  it('should show "At least 6 characters" when password is too short', () => {
    const passwordControl = component.registerForm.get('password')!;
    passwordControl.setValue('123');
    passwordControl.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.debugElement.queryAll(By.css('mat-error'));
    expect(errors.some(e => e.nativeElement.textContent.includes('At least 6 characters'))).toBeTrue();
  });

  it('should call authService.register on valid submit', () => {
    authService.register.and.returnValue(of(mockAuthResponse));
    component.registerForm.patchValue({ name: 'Jane Smith', email: 'a@b.com', password: '123456' });
    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'a@b.com',
      password: '123456',
    });
  });

  it('should navigate to /dashboard on success', () => {
    authService.register.and.returnValue(of(mockAuthResponse));
    component.registerForm.patchValue({ name: 'Jane Smith', email: 'a@b.com', password: '123456' });
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBeFalse();
  });

  it('should show "An account with this email already exists." on 409', () => {
    authService.register.and.returnValue(throwError(() => ({ status: 409 })));
    component.registerForm.patchValue({ name: 'Jane Smith', email: 'a@b.com', password: '123456' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('An account with this email already exists.');
    expect(component.loading).toBeFalse();
  });

  it('should show "Registration failed. Please try again." on other failures', () => {
    authService.register.and.returnValue(throwError(() => ({ status: 500 })));
    component.registerForm.patchValue({ name: 'Jane Smith', email: 'a@b.com', password: '123456' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Registration failed. Please try again.');
  });

  it('should not call register if the form is invalid', () => {
    component.onSubmit();
    expect(authService.register).not.toHaveBeenCalled();
  });
});