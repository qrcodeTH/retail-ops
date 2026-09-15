// The only file that knows the API's shape. Components call these functions, never fetch() directly.

export type User = { id: number; email: string; role: "manager" | "staff"; storeId: number };
export type Task = {
  id: number; storeId: number; title: string; description: string | null;
  status: "open" | "in_progress" | "done"; createdBy: number; assigneeId: number | null;
  createdAt: string; updatedAt: string;
};
export type TaskPage = { items: Task[]; nextBefore: number | null };

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

// Same-origin requests: the browser attaches the session cookie by itself; no token handling in JS at all.
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? res.statusText);
  return data as T;
}

export const api = {
  me: () => request<User>("GET", "/auth/me"),
  login: (email: string, password: string) => request<void>("POST", "/auth/login", { email, password }),
  logout: () => request<void>("POST", "/auth/logout"),
  listTasks: (before?: number) => request<TaskPage>("GET", `/tasks?limit=20${before ? `&before=${before}` : ""}`),
  createTask: (title: string) => request<Task>("POST", "/tasks", { title }),
  claim: (id: number) => request<Task>("POST", `/tasks/${id}/claim`),
  complete: (id: number) => request<Task>("POST", `/tasks/${id}/complete`),
};
