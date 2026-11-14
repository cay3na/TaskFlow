export interface Project {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  ownerName: string;
  taskCount: number;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface UpdateProjectRequest {
  name: string;
  description: string;
}
