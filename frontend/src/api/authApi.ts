import { apiRequest, clearAuthToken, setAuthToken } from './apiClient';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  displayName: string;
};

const persistAuth = (response: AuthResponse) => {
  setAuthToken(response.token);
  return response;
};

export const authApi = {
  async register(input: RegisterInput) {
    return persistAuth(await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: input
    }));
  },

  async login(input: LoginInput) {
    return persistAuth(await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: input
    }));
  },

  async me() {
    return apiRequest<AuthUser>('/api/auth/me');
  },

  async logout() {
    try {
      await apiRequest<void>('/api/auth/logout', {
        method: 'POST'
      });
    } finally {
      clearAuthToken();
    }
  }
};
