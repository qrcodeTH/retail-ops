// Use cases: หนึ่งฟังก์ชัน = หนึ่งสิ่งที่ผู้ใช้ทำได้
// รับ repository เข้ามาทาง parameter (ไม่ import มาเอง) → เสียบ Postgres ตอนรันจริง เสียบ array ตอน test
import { DomainError } from "../../lib/domain-error.js";
import { assertCanCreate, claim, complete, type Actor, type Task } from "./domain.js";
import type { TaskRepository } from "./ports.js";

type Deps = { repo: TaskRepository; now?: () => Date };

export function makeTaskUseCases({ repo, now = () => new Date() }: Deps) {
  // กฎ: เห็นเฉพาะสาขาตัวเอง — storeId มาจาก actor (session) เสมอ
  async function requireOwnStoreTask(id: number, actor: Actor): Promise<Task> {
    const task = await repo.findInStore(id, actor.storeId);
    if (!task) throw new DomainError("not_found", "task not found");
    return task;
  }

  return {
    listTasks: (actor: Actor) => repo.listByStore(actor.storeId),

    getTask: (id: number, actor: Actor) => requireOwnStoreTask(id, actor),

    async createTask(actor: Actor, input: { title: string; description?: string }) {
      assertCanCreate(actor);
      return repo.insert({ storeId: actor.storeId, title: input.title, description: input.description ?? null, createdBy: actor.id });
    },

    async claimTask(id: number, actor: Actor) {
      const task = await requireOwnStoreTask(id, actor);
      return repo.save(claim(task, actor, now()));
    },

    async completeTask(id: number, actor: Actor) {
      const task = await requireOwnStoreTask(id, actor);
      return repo.save(complete(task, actor, now()));
    },
  };
}

export type TaskUseCases = ReturnType<typeof makeTaskUseCases>;
