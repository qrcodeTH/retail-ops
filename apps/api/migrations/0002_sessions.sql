-- session: "ตั๋ว" ที่ server ออกให้หลัง login
-- id เป็น random string ยาว ไม่ใช่ serial เพราะห้ามเดาได้
CREATE TABLE sessions (
  id         text PRIMARY KEY,
  user_id    int NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- ลบ user = session หายทันที
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
