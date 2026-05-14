const API_BASE_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export async function fetchBlob(path: string): Promise<Blob> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).detail || `Request failed: ${response.status}`);
  }
  return response.blob();
}

export const authAPI = {
    login: (data: { email: string; password: string }) =>
        api.post<{ access_token: string }>("/auth/login", data),

    register: (data: unknown) =>
        api.post("/auth/register", data),
};

export const usersAPI = {
    getMe: (token?: string) =>
        request("/users/me", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
};