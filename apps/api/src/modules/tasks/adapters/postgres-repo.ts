// DB adapter: the only place in the tasks module that contains SQL
import type pg from "pg";
import type { Task, TaskStatus } from "../domain.js";
import type { NewTask, TaskRepository } from "../ports.js";

type Row = {
  id: number; store_id: number; title: string; description: string | null; status: TaskStatus;
  created_by: number; assignee_id: number | null; created_at: Date; updated_at: Date;
};
const toTask = (r: Row): Task => ({
  id: r.id, storeId: r.store_id, title: r.title, description: r.description, status: r.status,
  createdBy: r.created_by, assigneeId: r.assignee_id, createdAt: r.created_at, updatedAt: r.updated_at,
});

export function postgresTaskRepository(pool: pg.Pool): TaskRepository {
  return {
    async listByStore(storeId, { limit, before }) {
      const r = await pool.query<Row>(
        `SELECT * FROM tasks
          WHERE store_id = $1 AND ($2::int IS NULL OR id < $2)
          ORDER BY id DESC
          LIMIT $3`,
        [storeId, before ?? null, limit],
      );
      return r.rows.map(toTask);
    },
    async findInStore(id, storeId) {
      const r = await pool.query<Row>("SELECT * FROM tasks WHERE id = $1 AND store_id = $2", [id, storeId]);
      return r.rows[0] ? toTask(r.rows[0]) : null;
    },
    async insert(t) {
      const r = await pool.query<Row>(
        "INSERT INTO tasks (store_id, title, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
        [t.storeId, t.title, t.description, t.createdBy],
      );
      return toTask(r.rows[0]);
    },
    async save(t) {
      const r = await pool.query<Row>(
        "UPDATE tasks SET status = $2, assignee_id = $3, updated_at = $4 WHERE id = $1 RETURNING *",
        [t.id, t.status, t.assigneeId, t.updatedAt],
      );
      return toTask(r.rows[0]);
    },
  };
}
