// ทดสอบกฎธุรกิจทั้งหมดของ tasks โดยไม่มี Postgres, ไม่มี Express, ไม่มี network
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
  id: 1, storeId: BKK, title: "เติมน้ำดื่ม", description: null, status: "open",
  createdBy: managerBkk.id, assigneeId: null, createdAt: new Date(0), updatedAt: new Date(0), ...over,
});

function setup(seed: Task[]) {
  const repo = inMemoryTaskRepository(seed);
  return { repo, uc: makeTaskUseCases({ repo, now: () => new Date("2026-09-15T00:00:00Z") }) };
}

describe("กฎ: เห็นเฉพาะสาขาตัวเอง", () => {
  it("list คืนเฉพาะงานในสาขาของ actor", async () => {
    const { uc } = setup([task({ id: 1, storeId: BKK }), task({ id: 2, storeId: CNX })]);
    expect((await uc.listTasks(staffBkk)).map((t) => t.id)).toEqual([1]);
  });
  it("อ่านงานสาขาอื่นด้วย id ตรง ๆ → not_found (ไม่ใช่ forbidden)", async () => {
    const { uc } = setup([task({ id: 2, storeId: CNX })]);
    await expect(uc.getTask(2, staffBkk)).rejects.toMatchObject({ code: "not_found" });
  });
  it("รับงานสาขาอื่น → not_found", async () => {
    const { uc } = setup([task({ id: 2, storeId: CNX })]);
    await expect(uc.claimTask(2, staffBkk)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("กฎ: สร้างได้เฉพาะ manager ในสาขาตัวเอง", () => {
  it("staff สร้าง → forbidden", async () => {
    const { uc } = setup([]);
    await expect(uc.createTask(staffBkk, { title: "x" })).rejects.toMatchObject({ code: "forbidden" });
  });
  it("manager สร้าง → งานอยู่สาขาของ manager เสมอ", async () => {
    const { uc } = setup([]);
    const t = await uc.createTask(managerBkk, { title: "x" });
    expect(t).toMatchObject({ storeId: BKK, status: "open", createdBy: managerBkk.id });
  });
});

describe("กฎ: open → in_progress → done", () => {
  it("ปิดงานที่ยัง open → invalid_transition", async () => {
    const { uc } = setup([task({ status: "open" })]);
    await expect(uc.completeTask(1, staffBkk)).rejects.toMatchObject({ code: "invalid_transition" });
  });
  it("รับงาน → in_progress และ assignee = คนรับ", async () => {
    const { uc, repo } = setup([task({ status: "open" })]);
    await uc.claimTask(1, staffBkk);
    expect(repo.tasks[0]).toMatchObject({ status: "in_progress", assigneeId: staffBkk.id });
  });
  it("รับงานที่ถูกรับไปแล้ว → invalid_transition", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    await expect(uc.claimTask(1, staffBkk2)).rejects.toMatchObject({ code: "invalid_transition" });
  });
  it("ปิดงานที่ done แล้ว → invalid_transition", async () => {
    const { uc } = setup([task({ status: "done", assigneeId: staffBkk.id })]);
    await expect(uc.completeTask(1, staffBkk)).rejects.toMatchObject({ code: "invalid_transition" });
  });
});

describe("กฎ: ปิดงานได้เฉพาะคนรับหรือ manager", () => {
  it("staff คนอื่นปิดงานที่ไม่ใช่ของตัวเอง → forbidden", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    await expect(uc.completeTask(1, staffBkk2)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("คนรับปิดเอง → done", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    expect((await uc.completeTask(1, staffBkk)).status).toBe("done");
  });
  it("manager ปิดงานที่ staff รับไว้ → done", async () => {
    const { uc } = setup([task({ status: "in_progress", assigneeId: staffBkk.id })]);
    expect((await uc.completeTask(1, managerBkk)).status).toBe("done");
  });
});
