// Port: the contract the business rules require from the outside world —
// "I need a task store that can do these four things." Who provides it (Postgres, an array, SQLite) is not the rules' concern.
import type { Task } from "./domain.js";

export type NewTask = Pick<Task, "storeId" | "title" | "description" | "createdBy">;

// Keyset pagination: "give me `limit` tasks with id below `before`". Stable under inserts/deletes,
// unlike OFFSET, and O(page) instead of O(all rows) for the database.
export type Page = { limit: number; before?: number };

export interface TaskRepository {
  listByStore(storeId: number, page: Page): Promise<Task[]>;
  // Look up within "this store" only — the scope is part of the contract, not something a caller can forget
  findInStore(id: number, storeId: number): Promise<Task | null>;
  insert(task: NewTask): Promise<Task>;
  save(task: Task): Promise<Task>;
}
