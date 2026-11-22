import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';


describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let router: Router;

  const mockProject: Project = {
    id: 42,
    name: 'TaskFlow Redesign',
    description: 'Revamp the task board UI',
    ownerId: 1,
    ownerName: 'Test User',
    taskCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const todoTask: Task = {
    id: 101,
    title: 'Write tests',
    description: 'Add Jasmine specs',
    status: 'Todo',
    projectId: 42,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const inProgressTask: Task = {
    id: 102,
    title: 'Build API',
    description: '',
    status: 'InProgress',
    projectId: 42,
    assignedToId: 5,
    assignedToName: 'Bob',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const doneTask: Task = {
    id: 103,
    title: 'Setup CI',
    description: 'Configure pipeline',
    status: 'Done',
    projectId: 42,
    assignedToId: 7,
    assignedToName: 'Alice',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockTasks: Task[] = [todoTask, inProgressTask, doneTask];

  // route param ':id' is read via ActivatedRoute.snapshot.paramMap, so it's stubbed directly
  // rather than routed through RouterTestingModule
  const activatedRouteStub = {
    snapshot: { paramMap: convertToParamMap({ id: '42' }) },
  };

  beforeEach(async () => {
    const taskSpy = jasmine.createSpyObj('TaskService', [
      'getTasks',
      'createTask',
      'updateTask',
      'deleteTask',
    ]);

    const projectSpy = jasmine.createSpyObj('ProjectService', ['getProject', 'updateProject']);

    projectSpy.getProject.and.returnValue(of(mockProject));
    taskSpy.getTasks.and.returnValue(of(mockTasks));

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskSpy },
        { provide: ProjectService, useValue: projectSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    router = TestBed.inject(Router) as Router;
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the project id from the route and load its project and tasks', () => {
    expect(projectService.getProject).toHaveBeenCalledWith(42);
    expect(taskService.getTasks).toHaveBeenCalledWith(42);
    expect(component.projectId).toBe(42);
  });

  it('should populate the project signal from the service response', () => {
    expect(component.project()).toEqual(mockProject);
  });

  it('should populate the tasks signal and clear loading', () => {
    expect(component.tasks()).toEqual(mockTasks);
    expect(component.loading()).toBeFalse();
  });

  it('should navigate to /dashboard if the project fails to load', () => {
    projectService.getProject.and.returnValue(throwError(() => ({ status: 404 })));
    component.loadData(42);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should clear loading if the tasks fail to load', () => {
    taskService.getTasks.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadData(42);
    expect(component.loading()).toBeFalse();
  });

  it('should show "Loading..." as the heading before the project arrives', () => {
    // A fresh component instance whose getProject() observable hasn't emitted yet,
    // so this checks the actual pre-load render rather than guessing at it.
    const pendingProject$ = new Subject<Project>();
    projectService.getProject.and.returnValue(pendingProject$);

    const freshFixture = TestBed.createComponent(ProjectDetailComponent);
    freshFixture.detectChanges();

    const h1 = freshFixture.debugElement.query(By.css('.header-text h1')).nativeElement;
    expect(h1.textContent).toContain('Loading...');
  });

  it('should display the project name once loaded', () => {
    const h1 = fixture.debugElement.query(By.css('.header-text h1')).nativeElement;
    expect(h1.textContent).toContain('TaskFlow Redesign');
  });

  it('should display the project description when present', () => {
    const subtitle = fixture.debugElement.query(By.css('.header-text .subtitle'));
    expect(subtitle.nativeElement.textContent).toContain('Revamp the task board UI');
  });

  it('should hide the subtitle when the project has no description', () => {
    component.project.set({ ...mockProject, description: '' });
    fixture.detectChanges();
    const subtitle = fixture.debugElement.query(By.css('.header-text .subtitle'));
    expect(subtitle).toBeFalsy();
  });

  it('should navigate back to the dashboard when the back button is clicked', () => {
    const backBtn = fixture.debugElement.query(
      By.css('.page-header button[title="Back to Dashboard"]')
    ).nativeElement;
    backBtn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should toggle the create-task form when "Add Task" is clicked', () => {
    expect(component.showCreateForm()).toBeFalse();
    const toggleBtn = fixture.debugElement.query(
      By.css('.page-header button[color="primary"]')
    ).nativeElement;

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showCreateForm()).toBeTrue();
    expect(fixture.debugElement.query(By.css('.create-card'))).toBeTruthy();
    expect(toggleBtn.textContent).toContain('Cancel');

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showCreateForm()).toBeFalse();
    expect(fixture.debugElement.query(By.css('.create-card'))).toBeFalsy();
    expect(toggleBtn.textContent).toContain('Add Task');
  });

  it('should show "Title is required" when the task title is empty', () => {
    component.toggleCreateForm();
    component.createForm.get('title')!.markAsTouched();
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('mat-error'));
    expect(error.nativeElement.textContent).toContain('Title is required');
  });

  it('should disable the "Add Task" submit button when the form is invalid', () => {
    component.toggleCreateForm();
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(
      By.css('.create-card button[type="submit"]')
    ).nativeElement;
    expect(submitBtn.disabled).toBeTrue();
  });

  it('should enable the "Add Task" submit button when the form is valid', () => {
    component.toggleCreateForm();
    component.createForm.patchValue({ title: 'A new task' });
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(
      By.css('.create-card button[type="submit"]')
    ).nativeElement;
    expect(submitBtn.disabled).toBeFalse();
  });

  it('should call taskService.createTask with the project id and form value, then reset and hide the form', () => {
    const createdTask: Task = {
      id: 104,
      title: 'New task',
      description: 'desc',
      status: 'Todo',
      projectId: 42,
      createdAt: '2026-01-06T00:00:00Z',
      updatedAt: '2026-01-06T00:00:00Z',
    };
    taskService.createTask.and.returnValue(of(createdTask));

    component.toggleCreateForm();
    component.createForm.patchValue({ title: 'New task', description: 'desc' });
    component.createTask();

    expect(taskService.createTask).toHaveBeenCalledWith(42, { title: 'New task', description: 'desc' });
    expect(component.tasks()).toContain(createdTask);
    expect(component.showCreateForm()).toBeFalse();
    expect(component.createForm.get('title')?.value).toBeFalsy();
  });

  it('should default description to an empty string when not provided', () => {
    taskService.createTask.and.returnValue(
      of({ ...todoTask, id: 105, title: 'No Desc', description: '' })
    );
    component.toggleCreateForm();
    component.createForm.patchValue({ title: 'No Desc' });
    component.createTask();

    expect(taskService.createTask).toHaveBeenCalledWith(42, { title: 'No Desc', description: '' });
  });

  it('should not call createTask if the form is invalid', () => {
    component.toggleCreateForm();
    component.createTask();
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('should list tasks under their matching kanban column', () => {
    const columns = fixture.debugElement.queryAll(By.css('.kanban-column'));
    expect(columns.length).toBe(3);

    expect(columns[0].nativeElement.textContent).toContain('Write tests');
    expect(columns[1].nativeElement.textContent).toContain('Build API');
    expect(columns[2].nativeElement.textContent).toContain('Setup CI');
  });

  it('should show the task count in each column heading', () => {
    const titles = fixture.debugElement.queryAll(By.css('.column-title'));
    expect(titles[0].nativeElement.textContent).toContain('To Do (1)');
    expect(titles[1].nativeElement.textContent).toContain('In Progress (1)');
    expect(titles[2].nativeElement.textContent).toContain('Done (1)');
  });

  it('should show "No tasks here" in a column with no matching tasks', () => {
    taskService.getTasks.and.returnValue(of([todoTask]));
    component.loadData(42);
    fixture.detectChanges();

    const columns = fixture.debugElement.queryAll(By.css('.kanban-column'));
    expect(columns[1].query(By.css('.empty-column')).nativeElement.textContent).toContain('No tasks here');
    expect(columns[2].query(By.css('.empty-column')).nativeElement.textContent).toContain('No tasks here');
  });

  it('should not render a description paragraph for a task with no description', () => {
    const inProgressColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[1];
    expect(inProgressColumn.query(By.css('.task-desc'))).toBeFalsy();
  });

  it('should move a Todo task to InProgress when "Start" is clicked', () => {
    const updated: Task = { ...todoTask, status: 'InProgress' };
    taskService.updateTask.and.returnValue(of(updated));

    const todoColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[0];
    const startBtn = todoColumn.queryAll(By.css('mat-card-actions button'))[0].nativeElement;
    startBtn.click();

    // The component maps 'InProgress' to the numeric value 1 before calling the service
    // (see the statusMap in updateStatus), worth confirming this is intentional, since
    // UpdateTaskRequest.status is typed as TaskStatus (a string), not a number
    expect(taskService.updateTask).toHaveBeenCalledWith(42, todoTask.id, {
      title: todoTask.title,
      description: todoTask.description,
      status: 1 as any,
      assignedToId: todoTask.assignedToId,
    });
    expect(component.tasks().find(t => t.id === todoTask.id)).toEqual(updated);
  });

  it('should move an InProgress task to Done when "Done" is clicked', () => {
    const updated: Task = { ...inProgressTask, status: 'Done' };
    taskService.updateTask.and.returnValue(of(updated));

    const inProgressColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[1];
    const doneBtn = inProgressColumn.queryAll(By.css('mat-card-actions button'))[0].nativeElement;
    doneBtn.click();

    expect(taskService.updateTask).toHaveBeenCalledWith(42, inProgressTask.id, {
      title: inProgressTask.title,
      description: inProgressTask.description,
      status: 2 as any,
      assignedToId: inProgressTask.assignedToId,
    });
  });

  it('should move an InProgress task back to Todo when the undo button is clicked', () => {
    const updated: Task = { ...inProgressTask, status: 'Todo' };
    taskService.updateTask.and.returnValue(of(updated));

    const inProgressColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[1];
    const undoBtn = inProgressColumn.queryAll(By.css('mat-card-actions button'))[1].nativeElement;
    undoBtn.click();

    expect(taskService.updateTask).toHaveBeenCalledWith(42, inProgressTask.id, {
      title: inProgressTask.title,
      description: inProgressTask.description,
      status: 0 as any,
      assignedToId: inProgressTask.assignedToId,
    });
  });

  it('should reopen a Done task back to InProgress when "Reopen" is clicked', () => {
    const updated: Task = { ...doneTask, status: 'InProgress' };
    taskService.updateTask.and.returnValue(of(updated));

    const doneColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[2];
    const reopenBtn = doneColumn.queryAll(By.css('mat-card-actions button'))[0].nativeElement;
    reopenBtn.click();

    expect(taskService.updateTask).toHaveBeenCalledWith(42, doneTask.id, {
      title: doneTask.title,
      description: doneTask.description,
      status: 1 as any,
      assignedToId: doneTask.assignedToId,
    });
  });

  it('should delete a task when the user confirms the dialog', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    taskService.deleteTask.and.returnValue(of(undefined));

    const todoColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[0];
    const deleteBtn = todoColumn.queryAll(By.css('button[color="warn"]'))[0].nativeElement;
    deleteBtn.click();

    expect(taskService.deleteTask).toHaveBeenCalledWith(42, todoTask.id);
    expect(component.tasks().find(t => t.id === todoTask.id)).toBeUndefined();
  });

  it('should not delete a task when the user cancels the dialog', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const todoColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[0];
    const deleteBtn = todoColumn.queryAll(By.css('button[color="warn"]'))[0].nativeElement;
    deleteBtn.click();

    expect(taskService.deleteTask).not.toHaveBeenCalled();
    expect(component.tasks().find(t => t.id === todoTask.id)).toBeTruthy();
  });

  it('should mark a Done task card with the done-card class', () => {
    const doneColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[2];
    const doneCard = doneColumn.query(By.css('.task-card'));
    expect(doneCard.nativeElement.classList).toContain('done-card');
  });


  it('should open the project edit form pre-filled with the current name and description', () => {
    component.startEditProject();
    fixture.detectChanges();
   
    expect(component.editingProject()).toBeTrue();
    expect(component.projectEditForm.value).toEqual({
      name: 'TaskFlow Redesign',
      description: 'Revamp the task board UI',
    });
    expect(fixture.debugElement.query(By.css('.header-text form.edit-form'))).toBeTruthy();
  });
   
  it('should open the project edit form when the pencil next to the title is clicked', () => {
    const pencil = fixture.debugElement.query(By.css('.title-row .edit-btn')).nativeElement;
    pencil.click();
    expect(component.editingProject()).toBeTrue();
  });
   
  it('should close the project edit form on Cancel without calling the API', () => {
    component.startEditProject();
    fixture.detectChanges();
    component.cancelEditProject();
    fixture.detectChanges();
 
    expect(component.editingProject()).toBeFalse();
    expect(projectService.updateProject).not.toHaveBeenCalled();
    expect(fixture.debugElement.query(By.css('.header-text form'))).toBeFalsy();
  });
   
  it('should send trimmed project values to the API and show the saved project', () => {
    const updated: Project = {
      ...mockProject,
      name: 'Fixed name',
      description: 'Fixed desc',
      updatedAt: '2026-11-22T11:05:00Z',
    };
    projectService.updateProject.and.returnValue(of(updated));
 
    component.startEditProject();
    component.projectEditForm.setValue({ name: '  Fixed name  ', description: ' Fixed desc ' });
    component.saveProject();
 
    expect(projectService.updateProject).toHaveBeenCalledWith(42, {
      name: 'Fixed name',
      description: 'Fixed desc',
    });
    expect(component.project()).toEqual(updated);
    expect(component.editingProject()).toBeFalse();
  });
 
  it('should not save a project whose name is only spaces', () => {
    component.startEditProject();
    component.projectEditForm.patchValue({ name: '   ' });
    expect(component.projectEditForm.invalid).toBeTrue();
 
    component.saveProject();
    expect(projectService.updateProject).not.toHaveBeenCalled();
  });
 
  it('should keep the project editor open and show an error if saving fails', () => {
    projectService.updateProject.and.returnValue(throwError(() => ({ status: 500 })));
 
    component.startEditProject();
    component.saveProject();
 
    expect(component.editingProject()).toBeTrue();
    expect(component.editError()).toContain('Could not save the project');
  });
 

  //EDIT TASK
 
  it('should open the task editor, pre-filled, when a task pencil is clicked', () => {
    const todoColumn = fixture.debugElement.queryAll(By.css('.kanban-column'))[0];
    todoColumn.query(By.css('.edit-btn')).nativeElement.click();
    fixture.detectChanges();
 
    expect(component.editingTaskId()).toBe(todoTask.id);
    expect(component.taskEditForm.value).toEqual({
      title: 'Write tests',
      description: 'Add Jasmine specs',
    });
    expect(todoColumn.query(By.css('form.edit-form'))).toBeTruthy();
  });
 
  it('should allow only one task editor open at a time', () => {
    component.startEditTask(todoTask);
    component.startEditTask(inProgressTask);
    fixture.detectChanges();
 
    expect(component.editingTaskId()).toBe(inProgressTask.id);
    expect(fixture.debugElement.queryAll(By.css('form.edit-form')).length).toBe(1);
  });
 
  it('should close the project editor when a task editor opens, and the other way round', () => {
    component.startEditProject();
    component.startEditTask(todoTask);
    expect(component.editingProject()).toBeFalse();
    expect(component.editingTaskId()).toBe(todoTask.id);
 
    component.startEditProject();
    expect(component.editingTaskId()).toBeNull();
    expect(component.editingProject()).toBeTrue();
  });
 
  it('should close the task editor on Cancel without calling the API', () => {
    component.startEditTask(todoTask);
    component.cancelEditTask();
 
    expect(component.editingTaskId()).toBeNull();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });
 
  it('should save edited task text, keep its status as a number, and update the card', () => {
    const updated: Task = {
      ...todoTask,
      title: 'Write more tests',
      description: 'New text',
      updatedAt: '2026-11-22T11:06:00Z',
    };
    taskService.updateTask.and.returnValue(of(updated));
 
    component.startEditTask(todoTask);
    component.taskEditForm.setValue({ title: '  Write more tests ', description: ' New text ' });
    component.saveTask(todoTask);
 
    expect(taskService.updateTask).toHaveBeenCalledWith(42, todoTask.id, {
      title: 'Write more tests',
      description: 'New text',
      status: 0 as any,                       // Todo stays 0
      assignedToId: todoTask.assignedToId,
    });
    expect(component.tasks().find(t => t.id === todoTask.id)).toEqual(updated);
    expect(component.editingTaskId()).toBeNull();
  });
 
  it('should keep the status and assignee of an InProgress task when only its text is edited', () => {
    taskService.updateTask.and.returnValue(of({ ...inProgressTask, title: 'Build API v2' }));
 
    component.startEditTask(inProgressTask);
    component.taskEditForm.setValue({ title: 'Build API v2', description: '' });
    component.saveTask(inProgressTask);
 
    expect(taskService.updateTask).toHaveBeenCalledWith(42, inProgressTask.id, {
      title: 'Build API v2',
      description: '',
      status: 1 as any,                       // InProgress stays 1
      assignedToId: 5,
    });
  });
 
  it('should not save a task whose title is only spaces', () => {
    component.startEditTask(todoTask);
    component.taskEditForm.patchValue({ title: '   ' });
    expect(component.taskEditForm.invalid).toBeTrue();
 
    component.saveTask(todoTask);
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });
 
  it('should keep the task editor open and show an error if saving fails', () => {
    taskService.updateTask.and.returnValue(throwError(() => ({ status: 500 })));
 
    component.startEditTask(todoTask);
    component.saveTask(todoTask);
 
    expect(component.editingTaskId()).toBe(todoTask.id);
    expect(component.editError()).toContain('Could not save the task');
  });
 
  // "LAST UPDATED" TIME
 
  it('should show a "Last updated" line on every task card', () => {
    const stamps = fixture.debugElement.queryAll(By.css('.task-card .timestamp'));
    expect(stamps.length).toBe(3);
    stamps.forEach(s => expect(s.nativeElement.textContent).toContain('Last updated:'));
  });
 
  it('should show "Last updated" for the project when the API sends updatedAt', () => {
    component.project.set({ ...mockProject, updatedAt: '2026-11-22T11:05:30.123' });
    fixture.detectChanges();
 
    const stamp = fixture.debugElement.query(By.css('.header-text .timestamp'));
    expect(stamp.nativeElement.textContent).toContain('Last updated:');
  });
 
  it('should hide the project "Last updated" line when updatedAt is missing', () => {
    expect(fixture.debugElement.query(By.css('.header-text .timestamp'))).toBeFalsy();
  });
 
  it('should treat API times without a Z as UTC (so the browser shows the right local hour)', () => {
    expect(component.asUtc('2026-11-22T11:05:30.123')).toBe('2026-11-22T11:05:30.123Z');
  });


});
