import axios, { AxiosError } from 'axios';
import { supabase } from './supabase';
import type { ApiResponse } from '@devconnect/shared';

/**
 * Axios instance for the DevConnect API.
 * - Attaches the Supabase access token to every request.
 * - Unwraps the `{ success, data, message }` envelope so callers get `data` directly.
 * - Surfaces the API's message on error via `error.message`.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // On 401, try to refresh the token once before giving up.
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed.session?.access_token) {
          // Retry original request with the new token.
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers['Authorization'] = `Bearer ${refreshed.session.access_token}`;
          return api(originalRequest);
        }
      } catch {
        // refresh failed — fall through to sign out
      }
      // Refresh failed — the session is truly gone, sign out silently.
      await supabase.auth.signOut().catch(() => undefined);
    }

    const message =
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED' ? 'Request timed out' : error.message);

    return Promise.reject(Object.assign(new Error(message), { status, original: error }));
  }
);

/** GET returning unwrapped data. */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  return data.data as T;
}

/** POST returning unwrapped data. */
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  return data.data as T;
}

/** PUT returning unwrapped data. */
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(url, body);
  return data.data as T;
}

/** PATCH returning unwrapped data. */
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return data.data as T;
}

/** DELETE returning unwrapped data. */
export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(url);
  return data.data as T;
}

/** Multipart upload helper (images). */
export async function upload<T>(url: string, form: FormData): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as T;
}
