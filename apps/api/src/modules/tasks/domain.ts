// ตรงกลางของ hexagon: กฎธุรกิจของ "งาน" ล้วน ๆ
// ไฟล์นี้ห้าม import pg, express หรืออะไรที่แตะโลกภายนอก — ทดสอบได้ด้วย JS เปล่า ๆ
import { DomainError } from "../../lib/domain-error.js";

export type TaskStatus = "open" | "in_progress" | "done";

export type Task = {
  id: number;
  storeId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: number;
  assigneeId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// "ผู้ใช้" ในสายตาของกฎ: รู้แค่ที่จำเป็นต่อการตัดสิน ไม่ผูกกับ session/cookie
export type Actor = { id: number; role: "manager" | "staff"; storeId: number };

// กฎ: สถานะเดินได้ทางเดียว open → in_progress → done
const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ["in_progress"],
  in_progress: ["done"],
  done: [],
};

function assertTransition(task: Task, next: TaskStatus) {
  if (!TRANSITIONS[task.status].includes(next)) {
    throw new DomainError("invalid_transition", `cannot go from ${task.status} to ${next}`);
  }
}

// กฎ: สร้างได้เฉพาะ manager
export function assertCanCreate(actor: Actor) {
  if (actor.role !== "manager") throw new DomainError("forbidden", "only managers can create tasks");
}

// กฎ: รับงาน = open → in_progress และผู้รับคือคนที่เรียก
// คืน task ใหม่ ไม่แก้ของเดิม (pure function: input เดิม → output เดิมเสมอ, test ง่าย)
export function claim(task: Task, actor: Actor, now: Date): Task {
  assertTransition(task, "in_progress");
  return { ...task, status: "in_progress", assigneeId: actor.id, updatedAt: now };
}

// กฎ: ปิดงาน = in_progress → done โดยคนรับงานหรือ manager
export function complete(task: Task, actor: Actor, now: Date): Task {
  assertTransition(task, "done");
  if (task.assigneeId !== actor.id && actor.role !== "manager") {
    throw new DomainError("forbidden", "only the assignee or a manager can complete a task");
  }
  return { ...task, status: "done", updatedAt: now };
}
