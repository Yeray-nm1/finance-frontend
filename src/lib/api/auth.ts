import { request } from './client';
import type { User } from '@/types/auth';

export const auth = {
  register: (email: string, password: string) =>
    request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: (signal?: AbortSignal) => request<{ user: User }>('/auth/me', { signal }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};
