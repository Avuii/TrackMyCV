const DEFAULT_API_URL = 'http://localhost:5228';
const AUTH_TOKEN_KEY = 'trackmycv.auth.token';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);

export const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

const buildHeaders = (headers?: HeadersInit, hasJsonBody = false) => {
  const result = new Headers(headers);
  const token = getAuthToken();

  if (hasJsonBody && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json');
  }

  if (token && !result.has('Authorization')) {
    result.set('Authorization', `Bearer ${token}`);
  }

  return result;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasJsonBody = Boolean(options.body) && typeof options.body === 'object' && !(options.body instanceof FormData);
  const body = hasJsonBody ? JSON.stringify(options.body) : options.body;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, hasJsonBody),
    body: body as BodyInit | null | undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiBlobRequest(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
    body: options.body as BodyInit | null | undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.blob();
}
