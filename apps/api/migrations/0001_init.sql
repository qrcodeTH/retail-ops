-- Stores: every permission boundary in the system is scoped to a row in this table
CREATE TABLE stores (
  id         serial PRIMARY KEY,
  code       text NOT NULL UNIQUE,          -- e.g. "BKK-001", the human-facing identifier
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Users: each belongs to exactly one store and has exactly one role
CREATE TABLE users (
  id            serial PRIMARY KEY,
  email         text NOT NULL UNIQUE,       -- login identifier; uniqueness enforced by the DB, not just app code
  password_hash text NOT NULL,              -- there is no plaintext password column, only the hash
  role          text NOT NULL CHECK (role IN ('manager', 'staff')),
  store_id      int  NOT NULL REFERENCES stores(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Tasks: every row carries store_id — this is what makes "see only your own store" checkable
CREATE TABLE tasks (
  id          serial PRIMARY KEY,
  store_id    int  NOT NULL REFERENCES stores(id),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'done')),
  created_by  int  NOT NULL REFERENCES users(id),   -- who created it (must be a manager — enforced in code)
  assignee_id int  REFERENCES users(id),            -- who claimed it (null while open)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- The main query is "all tasks for this store" → index on store_id
CREATE INDEX tasks_store_id_idx ON tasks (store_id);
