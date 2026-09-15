import { useEffect, useState } from "react";
import { api, ApiError, type User } from "./api";
import { LoginForm } from "./LoginForm";
import { TaskBoard } from "./TaskBoard";

// Frontend state: "who is logged in" lives here, in memory. The source of truth is the server's session —
// on every page load we ask /auth/me instead of trusting anything stored in the browser.
export function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still checking

  useEffect(() => {
    api.me().then(setUser).catch((e) => {
      if (e instanceof ApiError && e.status === 401) setUser(null);
      else throw e;
    });
  }, []);

  if (user === undefined) return <p className="muted">Loading…</p>;
  if (user === null) return <LoginForm onLoggedIn={setUser} />;

  return (
    <TaskBoard
      user={user}
      onLogout={async () => {
        await api.logout();
        setUser(null);
      }}
    />
  );
}
