import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, type Task, type User } from "./api";

const STATUS_LABEL = { open: "Open", in_progress: "In progress", done: "Done" } as const;

export function TaskBoard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadFirstPage() {
    const page = await api.listTasks();
    setTasks(page.items);
    setNextBefore(page.nextBefore);
  }
  async function loadMore() {
    if (nextBefore === null) return;
    const page = await api.listTasks(nextBefore);
    setTasks((t) => [...t, ...page.items]);
    setNextBefore(page.nextBefore);
  }
  useEffect(() => { loadFirstPage(); }, []);

  // Every action asks the server and replaces the local copy with the server's answer.
  // The browser never decides a task's status itself — the rules live in the API.
  async function act(fn: () => Promise<Task>) {
    setError(null);
    try {
      const updated = await fn();
      setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof ApiError ? `${err.code}: ${err.message}` : (err as Error).message);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const task = await api.createTask(title.trim());
      setTasks((ts) => [task, ...ts]);
      setTitle("");
    } catch (err) {
      setError(err instanceof ApiError ? `${err.code}: ${err.message}` : (err as Error).message);
    }
  }

  return (
    <main className="card wide">
      <header>
        <h1>Tasks — store #{user.storeId}</h1>
        <span className="muted">{user.email} · {user.role}</span>
        <button className="link" onClick={onLogout}>Sign out</button>
      </header>

      {/* The button is hidden for staff for a clean UI, but the API still rejects staff with 403 — hiding is not security */}
      {user.role === "manager" && (
        <form onSubmit={create} className="row">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task title" required maxLength={200} />
          <button>Create</button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <ul className="tasks">
        {tasks.map((t) => (
          <li key={t.id} className={t.status}>
            <span className="id">#{t.id}</span>
            <span className="title">{t.title}</span>
            <span className={`badge ${t.status}`}>{STATUS_LABEL[t.status]}</span>
            {t.status === "open" && <button onClick={() => act(() => api.claim(t.id))}>Claim</button>}
            {t.status === "in_progress" && (t.assigneeId === user.id || user.role === "manager") && (
              <button onClick={() => act(() => api.complete(t.id))}>Complete</button>
            )}
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="muted">No tasks in this store yet.</p>}
      {nextBefore !== null && <button className="link" onClick={loadMore}>Load more</button>}
    </main>
  );
}
