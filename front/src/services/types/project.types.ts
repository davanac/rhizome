export interface SignProjectPayload {
  projectId: string;
  profile: { id: string };
  hash: string;
}

export interface SignProjectResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  [key: string]: any;
}

export interface ProjectDependencies {
  projectsApi: any;
  authService: any;
}