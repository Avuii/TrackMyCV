const DEFAULT_API_URL = 'http://localhost:5228';
const AUTH_TOKEN_KEY = 'trackmycv.auth.token';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);

export const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

const requestMethod = (options: RequestOptions) => options.method?.toUpperCase() || 'GET';

const requestUrl = (path: string) => `${API_BASE_URL}${path}`;

const getBrowserOrigin = () => {
  if (typeof window === 'undefined') {
    return 'unknown origin';
  }

  return window.location.origin;
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const readResponseMessage = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return '';
  }

  try {
    const data = JSON.parse(text) as string | { title?: string; detail?: string; message?: string; errors?: unknown };

    if (typeof data === 'string') {
      return data;
    }

    const summary = data.detail || data.message || data.title;

    if (data.errors && typeof data.errors === 'object') {
      const validationMessages = Object.values(data.errors as Record<string, unknown>)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .map((value) => String(value))
        .filter(Boolean);

      if (validationMessages.length) {
        return validationMessages.join(' ');
      }
    }

    return summary || text;
  } catch {
    return text;
  }
};

const createHttpErrorMessage = async (response: Response, method: string, url: string) => {
  const body = await readResponseMessage(response);

  if (response.status === 401) {
    return 'Your session expired. Log in again to continue.';
  }

  if (response.status === 403) {
    return 'You do not have access to this resource.';
  }

  if (response.status === 404) {
    return body || 'The requested item was not found.';
  }

  if (response.status === 409) {
    return body || 'This item already exists.';
  }

  if (response.status >= 500) {
    return 'The API had a problem while processing this request. Try again in a moment.';
  }

  return body || `Request failed: ${method} ${url}`;
};

const createNetworkErrorMessage = (error: unknown, method: string, url: string) => [
  'Could not connect to the backend API.',
  `Check that the API is running at ${API_BASE_URL}.`,
  `Request: ${method} ${url}`,
  `Browser origin: ${getBrowserOrigin()}`,
  `Browser error: ${getErrorText(error)}`
].join('\n');

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
  const method = requestMethod(options);
  const url = requestUrl(path);

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options.headers, hasJsonBody),
      body: body as BodyInit | null | undefined
    });
  } catch (error) {
    throw new Error(createNetworkErrorMessage(error, method, url));
  }

  if (!response.ok) {
    throw new Error(await createHttpErrorMessage(response, method, url));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiBlobRequest(path: string, options: RequestOptions = {}): Promise<Blob> {
  const method = requestMethod(options);
  const url = requestUrl(path);
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options.headers),
      body: options.body as BodyInit | null | undefined
    });
  } catch (error) {
    throw new Error(createNetworkErrorMessage(error, method, url));
  }

  if (!response.ok) {
    throw new Error(await createHttpErrorMessage(response, method, url));
  }

  return response.blob();
}
