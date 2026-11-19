import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/project.model';
import { AuthResponse } from '../../core/models/auth.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';


describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockAuthResponse: AuthResponse = {
    userId: 1,
    name: 'Test User',
    email: 'a@b.com',
    token: 'fake-jwt-token',
    tokenExpiry: '2026-12-01T00:00:00Z',
  };

  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Project One',
      description: 'First project',
      ownerId: 1,
      ownerName: 'Test User',
      taskCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Project Two',
      description: '',
      ownerId: 1,
      ownerName: 'Test User',
      taskCount: 0,
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    const projectSpy = jasmine.createSpyObj('ProjectService', [
      'getProjects',
      'createProject',
      'deleteProject',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    authSpy.currentUser.and.returnValue(mockAuthResponse);
    projectSpy.getProjects.and.returnValue(of(mockProjects));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: projectSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as Router;
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call projectService.getProjects on init', () => {
    expect(projectService.getProjects).toHaveBeenCalled();
  });

  it('should populate projects from the service response', () => {
    expect(component.projects()).toEqual(mockProjects);
    expect(component.loading()).toBeFalse();
  });

  it('should display the welcome message with the user name', () => {
    const h1 = fixture.debugElement.query(By.css('.dashboard-header h1')).nativeElement;
    expect(h1.textContent).toContain('Test User');
  });

  it('should fall back to "User" when currentUser is null', () => {
    authService.currentUser.and.returnValue(null);
    expect(component.userName).toBe('User');
  });

  it('should display the project count in the subtitle', () => {
    const subtitle = fixture.debugElement.query(By.css('.subtitle')).nativeElement;
    expect(subtitle.textContent).toContain('2 project(s)');
  });

  it('should set loading to false if getProjects errors', () => {
    projectService.getProjects.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadProjects();
    expect(component.loading()).toBeFalse();
  });

  it('should show the empty state when there are no projects and loading is finished', () => {
    projectService.getProjects.and.returnValue(of([]));
    component.loadProjects();
    fixture.detectChanges();
    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('No projects yet');
  });

  it('should render a project card for each project', () => {
    const cards = fixture.debugElement.queryAll(By.css('.project-card'));
    expect(cards.length).toBe(2);
    expect(cards[0].nativeElement.textContent).toContain('Project One');
  });

  it('should show "No description provided." when a project has no description', () => {
    const cards = fixture.debugElement.queryAll(By.css('.project-card'));
    const secondCardDescription = cards[1].query(By.css('.description')).nativeElement;
    expect(secondCardDescription.textContent).toContain('No description provided.');
  });

  it('should toggle the create form when the "New Project" button is clicked', () => {
    expect(component.showCreateForm()).toBeFalse();
    const toggleBtn = fixture.debugElement.query(By.css('.dashboard-header button')).nativeElement;

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showCreateForm()).toBeTrue();
    expect(fixture.debugElement.query(By.css('.create-form-card'))).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showCreateForm()).toBeFalse();
    expect(fixture.debugElement.query(By.css('.create-form-card'))).toBeFalsy();
  });

  it('should reset the create form when closed', () => {
    component.toggleCreateForm();
    component.createForm.patchValue({ name: 'Draft name' });
    component.toggleCreateForm();
    expect(component.createForm.get('name')?.value).toBeFalsy();
  });

  it('should disable the create-project submit button when the form is invalid', () => {
    component.toggleCreateForm();
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(
      By.css('.create-form-card button[type="submit"]')
    ).nativeElement;
    expect(submitBtn.disabled).toBeTrue();
  });

  it('should enable the create-project submit button when the form is valid', () => {
    component.toggleCreateForm();
    component.createForm.patchValue({ name: 'A new project' });
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(
      By.css('.create-form-card button[type="submit"]')
    ).nativeElement;
    expect(submitBtn.disabled).toBeFalse();
  });

  it('should show "Name is required" when the project name is empty', () => {
    component.toggleCreateForm();
    component.createForm.get('name')!.markAsTouched();
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('mat-error'));
    expect(error.nativeElement.textContent).toContain('Name is required');
  });

  it('should call projectService.createProject on valid submit and append the result', () => {
    const newProject: Project = {
      id: 3,
      name: 'Fresh Project',
      description: 'desc',
      ownerId: 1,
      ownerName: 'Test User',
      taskCount: 0,
      createdAt: '2026-01-03T00:00:00Z',
    };
    projectService.createProject.and.returnValue(of(newProject));

    component.toggleCreateForm();
    component.createForm.patchValue({ name: 'Fresh Project', description: 'desc' });
    component.createProject();

    expect(projectService.createProject).toHaveBeenCalledWith({ name: 'Fresh Project', description: 'desc' });
    expect(component.projects()).toContain(newProject);
  });

  it('should default description to an empty string when not provided', () => {
    projectService.createProject.and.returnValue(
      of({
        id: 4,
        name: 'No Desc',
        description: '',
        ownerId: 1,
        ownerName: 'Test User',
        taskCount: 0,
        createdAt: '2026-01-04T00:00:00Z',
      })
    );
    component.toggleCreateForm();
    component.createForm.patchValue({ name: 'No Desc' });
    component.createProject();

    expect(projectService.createProject).toHaveBeenCalledWith({ name: 'No Desc', description: '' });
  });

  it('should close the create form after a successful create', () => {
    projectService.createProject.and.returnValue(
      of({
        id: 5,
        name: 'Closed Form',
        description: '',
        ownerId: 1,
        ownerName: 'Test User',
        taskCount: 0,
        createdAt: '2026-01-05T00:00:00Z',
      })
    );
    component.toggleCreateForm();
    component.createForm.patchValue({ name: 'Closed Form' });
    component.createProject();

    expect(component.showCreateForm()).toBeFalse();
  });

  it('should not call createProject if the form is invalid', () => {
    component.toggleCreateForm();
    component.createProject();
    expect(projectService.createProject).not.toHaveBeenCalled();
  });

  it('should navigate to the project detail page when a project card is clicked', () => {
    const card = fixture.debugElement.queryAll(By.css('.project-card'))[0];
    card.triggerEventHandler('click', null);
    expect(router.navigate).toHaveBeenCalledWith(['/projects', 1]);
  });

  it('should delete a project when the user confirms the dialog', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    projectService.deleteProject.and.returnValue(of(undefined));

    const fakeEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    component.deleteProject(fakeEvent, 1);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(projectService.deleteProject).toHaveBeenCalledWith(1);
    expect(component.projects().find(p => p.id === 1)).toBeUndefined();
  });

  it('should not delete a project when the user cancels the dialog', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const fakeEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    component.deleteProject(fakeEvent, 1);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(projectService.deleteProject).not.toHaveBeenCalled();
    expect(component.projects().find(p => p.id === 1)).toBeTruthy();
  });

  it('should stop click propagation so deleting a project does not also navigate', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    projectService.deleteProject.and.returnValue(of(undefined));

    const deleteBtn = fixture.debugElement.queryAll(By.css('.project-card button[color="warn"]'))[0]
      .nativeElement as HTMLButtonElement;
    deleteBtn.click();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});

