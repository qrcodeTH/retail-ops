// Test adapter: tasks stored in an in-memory array, honouring exactly the same contract as Postgres
import type { Task } from "../domain.js";
import type { NewTask, TaskRepository } from "../ports.js";

export function inMemoryTaskRepository(seed: Task[] = []): TaskRepository & { tasks: Task[] } {
  const tasks = [...seed];
  return {
    tasks,
    async listByStore(storeId, { limit, before }) {
      return tasks
        .filter((t) => t.storeId === storeId && (before === undefined || t.id < before))
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
    },
    async findInStore(id, storeId) {
      return tasks.find((t) => t.id === id && t.storeId === storeId) ?? null;
    },
    async insert(t: NewTask) {
      const task: Task = { ...t, id: tasks.length + 1, status: "open", assigneeId: null, createdAt: new Date(), updatedAt: new Date() };
      tasks.push(task);
      return task;
    },
    async save(t) {
      const i = tasks.findIndex((x) => x.id === t.id);
      tasks[i] = t;
      return t;
    },
  };
}
