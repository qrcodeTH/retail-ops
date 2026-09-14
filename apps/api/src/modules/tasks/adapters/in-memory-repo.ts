// Adapter สำหรับ test: ที่เก็บงานเป็น array ในหน่วยความจำ ทำสัญญาเดียวกับ Postgres ทุกข้อ
import type { Task } from "../domain.js";
import type { NewTask, TaskRepository } from "../ports.js";

export function inMemoryTaskRepository(seed: Task[] = []): TaskRepository & { tasks: Task[] } {
  const tasks = [...seed];
  return {
    tasks,
    async listByStore(storeId) {
      return tasks.filter((t) => t.storeId === storeId).sort((a, b) => b.id - a.id);
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
