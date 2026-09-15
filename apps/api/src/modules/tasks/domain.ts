// The centre of the hexagon: the pure business rules for "tasks".
// This file must never import pg, express, or anything that touches the outside world — it is testable with plain JS.
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

// The "user" as the rules see it: only what is needed to decide, not tied to sessions or cookies
export type Actor = { id: number; role: "manager" | "staff"; storeId: number };

// Rule: status moves one way only, open → in_progress → done
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

// Rule: only managers create tasks
export function assertCanCreate(actor: Actor) {
  if (actor.role !== "manager") throw new DomainError("forbidden", "only managers can create tasks");
}

// Rule: claiming = open → in_progress, and the assignee is whoever claims.
// Returns a new task instead of mutating (pure function: same input → same output, easy to test).
export function claim(task: Task, actor: Actor, now: Date): Task {
  assertTransition(task, "in_progress");
  return { ...task, status: "in_progress", assigneeId: actor.id, updatedAt: now };
}

// Rule: completing = in_progress → done, by the assignee or a manager
export function complete(task: Task, actor: Actor, now: Date): Task {
  assertTransition(task, "done");
  if (task.assigneeId !== actor.id && actor.role !== "manager") {
    throw new DomainError("forbidden", "only the assignee or a manager can complete a task");
  }
  return { ...task, status: "done", updatedAt: now };
}
