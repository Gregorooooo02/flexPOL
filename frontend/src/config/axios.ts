import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ProblemDetail } from '@/model';

/**
 * Shared axios instance for the HedgeFlex backend.
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

/**
 * Mock login: the backend knows the learner by this header. `AuthProvider` keeps it in sync
 * with the logged-in user; it identifies the learner but proves nothing.
 */
export const USER_HEADER = 'X-User-Email';

let currentUserEmail: string | null = null;

/** Called by `AuthProvider` whenever the logged-in user changes. */
export function setApiUserEmail(email: string | null) {
  currentUserEmail = email;
}

/**
 * Called when the backend doesn't know the user (401), for example after a restart of its
 * in-memory database. Resolves to true if the user was logged in again, so the request can be retried.
 */
let unauthorizedHandler: (() => Promise<boolean>) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<boolean>) | null) {
  unauthorizedHandler = handler;
}

/** Marks a request already retried after a 401, so a second 401 is reported instead of looping. */
type RetriableConfig = InternalAxiosRequestConfig & { retriedAfterLogin?: boolean };

apiClient.interceptors.request.use((config) => {
  if (currentUserEmail) {
    config.headers.set(USER_HEADER, currentUserEmail);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (error instanceof AxiosError) {
      const config = error.config as RetriableConfig | undefined;
      if (error.response?.status === 401 && config && unauthorizedHandler && !config.retriedAfterLogin) {
        config.retriedAfterLogin = true;
        if (await unauthorizedHandler()) {
          return apiClient(config);
        }
      }
      const problem = (error.response?.data as ProblemDetail | undefined) ?? null;
      const status = error.response?.status ?? null;
      const message = problem?.detail ?? (status ? `Request failed with status ${status}` : 'Cannot reach the server');
      return Promise.reject(new ApiError(message, status, problem));
    }
    return Promise.reject(error);
  },
);
