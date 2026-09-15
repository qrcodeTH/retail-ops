// HTTP adapter: request → use case → response.
// No business rules in this file, and no SQL.
import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db.js";
import { parse } from "../../lib/validate.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { postgresTaskRepository } from "./adapters/postgres-repo.js";
import { makeTaskUseCases, type TaskUseCases } from "./use-cases.js";

const createBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});
const idParam = z.object({ id: z.coerce.number().int().positive() });
// Page size is capped server-side: a client cannot ask for 20,000 rows no matter what it sends
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional(),
});

// Use cases are injected so HTTP-level tests can plug in the in-memory repo too
export function tasksRouter(tasks: TaskUseCases = makeTaskUseCases({ repo: postgresTaskRepository(pool) })) {
  const router = Router();
  router.use(requireAuth); // every route here requires a logged-in user

  router.get("/", async (req, res) => {
    res.json(await tasks.listTasks(req.user!, parse(listQuery, req.query)));
  });
  router.post("/", async (req, res) => {
    res.status(201).json(await tasks.createTask(req.user!, parse(createBody, req.body)));
  });
  router.get("/:id", async (req, res) => {
    res.json(await tasks.getTask(parse(idParam, req.params).id, req.user!));
  });
  router.post("/:id/claim", async (req, res) => {
    res.json(await tasks.claimTask(parse(idParam, req.params).id, req.user!));
  });
  router.post("/:id/complete", async (req, res) => {
    res.json(await tasks.completeTask(parse(idParam, req.params).id, req.user!));
  });
  return router;
}
