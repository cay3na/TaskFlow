export type TaskStatus = 'Todo' | 'InProgress' | 'Done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: number;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedToId?: number;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  assignedToId?: number;
}
