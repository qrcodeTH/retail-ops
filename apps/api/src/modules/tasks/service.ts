// LAYERED VERSION (step 3): กฎธุรกิจกับ SQL อยู่ในไฟล์เดียวกัน
// step 4 จะแยกกฎออกจาก SQL ให้เห็นความต่างกับ hexagonal
import { pool } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import type { SessionUser } from "../auth/session.js";

export type TaskStatus = "open" | "in_progress" | "done";
export type Task = {
  id: number;
  storeId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: number;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
};

// กฎ: สถานะเดินได้ทางเดียว open → in_progress → done
const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ["in_progress"],
  in_progress: ["done"],
  done: [],
};

type Row = {
  id: number; store_id: number; title: string; description: string | null; status: TaskStatus;
  created_by: number; assignee_id: number | null; created_at: string; updated_at: string;
};
const toTask = (r: Row): Task => ({
  id: r.id, storeId: r.store_id, title: r.title, description: r.description, status: r.status,
  createdBy: r.created_by, assigneeId: r.assignee_id, createdAt: r.created_at, updatedAt: r.updated_at,
});

// กฎ: เห็นเฉพาะสาขาตัวเอง — WHERE store_id มาจาก session เสมอ ไม่รับจาก client
export async function listTasks(user: SessionUser): Promise<Task[]> {
  const r = await pool.query<Row>("SELECT * FROM tasks WHERE store_id = $1 ORDER BY id DESC", [user.storeId]);
  return r.rows.map(toTask);
}

// หา task "ในสาขาของ user" — ถ้าอยู่สาขาอื่นถือว่าไม่มี (404) ไม่บอกว่ามีแต่ห้าม (403)
// เพื่อไม่ให้คนนอกสาขาไล่เดา id แล้วรู้ว่างานไหนมีอยู่จริง
async function getOwnStoreTask(id: number, user: SessionUser): Promise<Task> {
  const r = await pool.query<Row>("SELECT * FROM tasks WHERE id = $1 AND store_id = $2", [id, user.storeId]);
  if (!r.rows[0]) throw new HttpError(404, "task_not_found");
  return toTask(r.rows[0]);
}
export const getTask = getOwnStoreTask;

// กฎ: สร้างได้เฉพาะ manager และสร้างในสาขาตัวเองเท่านั้น
export async function createTask(user: SessionUser, input: { title: string; description?: string }): Promise<Task> {
  if (user.role !== "manager") throw new HttpError(403, "forbidden");
  const r = await pool.query<Row>(
    "INSERT INTO tasks (store_id, title, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
    [user.storeId, input.title, input.description ?? null, user.id],
  );
  return toTask(r.rows[0]);
}

// กฎ: รับงานได้เฉพาะงาน open ในสาขาตัวเอง ผู้รับคือคนที่เรียก
export async function claimTask(id: number, user: SessionUser): Promise<Task> {
  const task = await getOwnStoreTask(id, user);
  assertTransition(task, "in_progress");
  const r = await pool.query<Row>(
    "UPDATE tasks SET status = 'in_progress', assignee_id = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, user.id],
  );
  return toTask(r.rows[0]);
}

// กฎ: ปิดงานได้เฉพาะคนที่รับงานนั้น หรือ manager ของสาขา
export async function completeTask(id: number, user: SessionUser): Promise<Task> {
  const task = await getOwnStoreTask(id, user);
  assertTransition(task, "done");
  if (task.assigneeId !== user.id && user.role !== "manager") throw new HttpError(403, "forbidden");
  const r = await pool.query<Row>(
    "UPDATE tasks SET status = 'done', updated_at = now() WHERE id = $1 RETURNING *",
    [id],
  );
  return toTask(r.rows[0]);
}

function assertTransition(task: Task, next: TaskStatus) {
  if (!TRANSITIONS[task.status].includes(next)) {
    // 409 conflict: request ถูกรูปแบบ แต่ขัดกับสถานะปัจจุบันของข้อมูล
    throw new HttpError(409, "invalid_transition", `cannot go from ${task.status} to ${next}`);
  }
}
