import { request } from './client';
import type { User } from '@/types/auth';

interface AuthResponse {
  user: User;
}

export const auth = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: (signal?: AbortSignal) => request<AuthResponse>('/auth/me', { signal }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};
