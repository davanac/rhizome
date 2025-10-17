// Service layer exports - main entry point for all services
export { AuthService } from './auth.service';
export { ProjectService } from './project.service';
export { NetworkService } from './network.service';

// Service hooks
export { useAuthService } from './hooks/useAuthService';
export { useProjectService } from './hooks/useProjectService';
export { useNetworkService } from './hooks/useNetworkService';

// Service types
export type { 
  LoginResult, 
  SessionResult, 
  AuthDependencies 
} from './types/auth.types';

export type { 
  SignProjectPayload, 
  SignProjectResult, 
  ProjectData, 
  ProjectDependencies 
} from './types/project.types';

export type {
  NetworkData,
  NetworkDependencies
} from './types/network.types';