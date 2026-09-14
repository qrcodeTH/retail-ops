-- สาขา: ขอบเขตของสิทธิ์ทั้งหมดผูกกับตารางนี้
CREATE TABLE stores (
  id         serial PRIMARY KEY,
  code       text NOT NULL UNIQUE,          -- เช่น "BKK-001" ใช้ในการอ้างอิงจากมนุษย์
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ผู้ใช้: ทุกคนสังกัดหนึ่งสาขา และมีหนึ่ง role
CREATE TABLE users (
  id            serial PRIMARY KEY,
  email         text NOT NULL UNIQUE,       -- login ด้วย email ซ้ำไม่ได้ (DB บังคับ ไม่ใช่แค่โค้ดเช็ค)
  password_hash text NOT NULL,              -- ไม่มีคอลัมน์ password ตัวจริง มีแต่ hash
  role          text NOT NULL CHECK (role IN ('manager', 'staff')),
  store_id      int  NOT NULL REFERENCES stores(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- งาน: ทุกแถวมี store_id → นี่คือสิ่งที่ทำให้ "เห็นเฉพาะสาขาตัวเอง" เช็คได้
CREATE TABLE tasks (
  id          serial PRIMARY KEY,
  store_id    int  NOT NULL REFERENCES stores(id),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'done')),
  created_by  int  NOT NULL REFERENCES users(id),   -- ใครสร้าง (ต้องเป็น manager — เช็คในโค้ด)
  assignee_id int  REFERENCES users(id),            -- ใครรับงาน (ว่างได้ตอน open)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- query หลักคือ "งานทั้งหมดของสาขานี้" → index ตาม store_id
CREATE INDEX tasks_store_id_idx ON tasks (store_id);
