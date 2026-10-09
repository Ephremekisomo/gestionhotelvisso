const TOKEN_KEY = 'hotel_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface Options {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
}

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, query, token } = opts;

  let url = `/api/v1${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const authToken = token !== undefined ? token : getToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiClientError(
      res.status,
      json.message || `Erreur ${res.status}`,
      json.details
    );
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Options['query']) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: unknown } }>(
      '/auth/login',
      { method: 'POST', body: { email, password }, token: null }
    ),
  upload: <T = { success: boolean; data: { url: string } }>(path: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    const authToken = getToken();
    const headers: HeadersInit = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return fetch(`/api/v1${path}`, {
      method: 'POST',
      headers,
      body: form,
    }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new ApiClientError(res.status, json.message || `Erreur ${res.status}`, json.details);
      }
      return json as T;
    });
  },
};
