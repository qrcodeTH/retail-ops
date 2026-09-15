// Use cases: one function = one thing a user can do.
// The repository is passed in (not imported) → Postgres is plugged in at runtime, an array is plugged in for tests.
import { DomainError } from "../../lib/domain-error.js";
import { assertCanCreate, claim, complete, type Actor, type Task } from "./domain.js";
import type { Page, TaskRepository } from "./ports.js";

type Deps = { repo: TaskRepository; now?: () => Date };

export function makeTaskUseCases({ repo, now = () => new Date() }: Deps) {
  // Rule: you only see your own store — storeId always comes from the actor (the session)
  async function requireOwnStoreTask(id: number, actor: Actor): Promise<Task> {
    const task = await repo.findInStore(id, actor.storeId);
    if (!task) throw new DomainError("not_found", "task not found");
    return task;
  }

  return {
    // Returns one page plus the cursor for the next one (null when this was the last page)
    async listTasks(actor: Actor, page: Page) {
      const items = await repo.listByStore(actor.storeId, page);
      const nextBefore = items.length === page.limit ? items[items.length - 1]!.id : null;
      return { items, nextBefore };
    },

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
