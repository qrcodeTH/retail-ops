// Tests every business rule of the tasks module with no Postgres, no Express, no network
import { describe, expect, it } from "vitest";
import type { Actor, Task } from "../domain.js";
import { inMemoryTaskRepository } from "../adapters/in-memory-repo.js";
import { makeTaskUseCases } from "../use-cases.js";

const BKK = 1, CNX = 2;
const managerBkk: Actor = { id: 10, role: "manager", storeId: BKK };
const staffBkk: Actor = { id: 11, role: "staff", storeId: BKK };
const staffBkk2: Actor = { id: 12, role: "staff", storeId: BKK };
const staffCnx: Actor = { id: 21, role: "staff", storeId: CNX };

const task = (over: Partial<Task>): Task => ({
  id: 1, storeId: BKK, title: "Restock water, aisle 3", description: null, status: "open",
  createdBy: managerBkk.id, assigneeId: null, createdAt: new Date(0), updatedAt: new Date(0), ...over,
});

function setup(seed: Task[]) {
  const repo = inMemoryTaskRepository(seed);
  return { repo, uc: makeTaskUseCases({ repo, now: () => new Date("2026-09-15T00:00:00Z") }) };
}

describe("rule: you only see your own store", () => {
  it("list returns only tasks in the actor's store", async () => {
    const { uc } = setup([task({ id: 1, storeId: BKK }), task({ id: 2, storeId: CNX })]);
    const page = await uc.listTasks(staffBkk, { limit: 50 });
    expect(page.items.map((t) => t.id)).toEqual([1]);
    expect(page.nextBefore).toBeNull();
  });
  it("list is paginated by keyset: newest first, cursor points below the last item", async () => {
    const { uc } = setup([1, 2, 3, 4, 5].map((id) => task({ id })));
    const first = await uc.listTasks(staffBkk, { limit: 2 });
    expect(first.items.map((t) => t.id)).toEqual([5, 4]);
    expect(first.nextBefore).toBe(4);
    const second = await uc.listTasks(staffBkk, { limit: 2, before: first.nextBefore! });
    expect(second.items.map((t) => t.id)).toEqual([3, 2]);
    const last = await uc.listTasks(staffBkk, { limit: 2, before: second.nextBefore! });
    expect(last.items.map((t) => t.id)).toEqual([1]);
    expect(last.nextBefore).toBeNull();
  });
  it("reading another store's task by id → not_found (not forbidden)", async () => {
    const { uc } = setup([task({ id: 2, storeId: CNX })]);
    await expect(uc.getTask(2, staffBkk)).rejects.toMatchObject({ code: "not_found" });
  });
  it("claiming another store's task → not_found", async () => {
    const { uc } = setup([task({ id: 2, storeId: CNX })]);
    await expect(uc.claimTask(2, staffBkk)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("rule: only managers create tasks, and only in their own store", () => {
  it("staff creating → forbidden", async () => {
    const { uc } = setup([]);
    await expect(uc.createTask(staffBkk, { title: "x" })).rejects.toMatchObject({ code: "forbidden" });
  });
  it("manager creating → task lands in the manager's store", async () => {
    const { uc } = setup([]);
    const t = await uc.createTask(managerBkk, { title: "x" });
    expect(t).toMatchObject({ storeId: BKK, status: "open", createdBy: managerBkk.id });
  });
});

describe("rule: open → in_progress → done", () => {
  it("completing a task that is still open → invalid_transition", async () => {
    const { uc } = setup([task({ status: "open" })]);
    await expect(uc.completeTask(1, staffBkk)).rejects.toMatchObject({ code: "invalid_transition" });
  });
  it("claiming → in_progress with assignee = the claimer", async () => {
    const { uc, repo } = setup([task({ status: "open" })]);
    await uc.claimTask(1, staffBkk);
    expect(repo.tasks[0]).toMatchObject({ status: "in_progress", assigneeId: staffBkk.id });
  });
  it("claiming an already-claimed task → invalid_transition", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    await expect(uc.claimTask(1, staffBkk2)).rejects.toMatchObject({ code: "invalid_transition" });
  });
  it("completing a task that is already done → invalid_transition", async () => {
    const { uc } = setup([task({ status: "done", assigneeId: staffBkk.id })]);
    await expect(uc.completeTask(1, staffBkk)).rejects.toMatchObject({ code: "invalid_transition" });
  });
});

describe("rule: only the assignee or a manager completes a task", () => {
  it("a different staff member completing someone else's task → forbidden", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    await expect(uc.completeTask(1, staffBkk2)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("the assignee completes → done", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    expect((await uc.completeTask(1, staffBkk)).status).toBe("done");
  });
  it("a manager completes a task claimed by staff → done", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    expect((await uc.completeTask(1, managerBkk)).status).toBe("done");
  });
});
