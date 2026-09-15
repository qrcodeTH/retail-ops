import { useState, type FormEvent } from "react";
import { api, ApiError, type User } from "./api";

export function LoginForm({ onLoggedIn }: { onLoggedIn: (u: User) => void }) {
  const [email, setEmail] = useState("manager.bkk@retail.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email, password);
      onLoggedIn(await api.me()); // the cookie is now set; ask the server who we are
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Wrong email or password" : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>retail-ops</h1>
      <form onSubmit={submit}>
        <label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label>Password <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="muted">Demo: manager.bkk / staff.bkk / manager.cnx / staff.cnx @retail.test — password123</p>
    </main>
  );
}
