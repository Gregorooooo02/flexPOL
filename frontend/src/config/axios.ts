import axios, { AxiosError } from 'axios';
import type { ProblemDetail } from '@/model';

/**
 * Shared axios instance for the Finance Quest backend.
 * In development, Vite proxies `/api` to http://localhost:8080 (see vite.config.ts).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { Accept: 'application/json' },
  timeout: 10_000,
});

/** An API failure with the HTTP status and the backend's problem detail, if any. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly problem: ProblemDetail | null;

  constructor(message: string, status: number | null, problem: ProblemDetail | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (error instanceof AxiosError) {
      const problem = (error.response?.data as ProblemDetail | undefined) ?? null;
      const status = error.response?.status ?? null;
      const message = problem?.detail ?? (status ? `Request failed with status ${status}` : 'Cannot reach the server');
      return Promise.reject(new ApiError(message, status, problem));
    }
    return Promise.reject(error);
  },
);
