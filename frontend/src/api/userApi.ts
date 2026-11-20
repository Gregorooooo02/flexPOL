import type { LoginRequest, User } from '@/model';
import { apiClient } from '@/config/axios';

/** POST /api/users/login: mock login. Finds the user by email, or creates one. */
export async function loginUser(request: LoginRequest, signal?: AbortSignal): Promise<User> {
  const { data } = await apiClient.post<User>('/users/login', request, { signal });
  return data;
}
