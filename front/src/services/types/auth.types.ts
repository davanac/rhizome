export interface LoginResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
}

export interface SessionResult {
  success: boolean;
  session?: any;
  error?: string;
}

export interface AuthDependencies {
  authApi: any;
  profilesApi: any;
  router: any;
  toast: any;
}

export interface StoredAuthData {
  token?: string;
  user?: any;
  profile?: any;
}