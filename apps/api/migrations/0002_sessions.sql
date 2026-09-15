-- Sessions: the "ticket" the server issues after login
-- id is a long random string, not a serial — it must be unguessable
CREATE TABLE sessions (
  id         text PRIMARY KEY,
  user_id    int NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- deleting a user kills their sessions
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
