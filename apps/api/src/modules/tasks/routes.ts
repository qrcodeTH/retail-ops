// Adapter ฝั่ง HTTP: แปลง request → เรียก use case → แปลงผลเป็น response
// ไม่มีกฎธุรกิจในไฟล์นี้ และไม่มี SQL
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

// รับ use cases เข้ามา เพื่อให้ test ระดับ HTTP เสียบ in-memory repo ได้เช่นกัน
export function tasksRouter(tasks: TaskUseCases = makeTaskUseCases({ repo: postgresTaskRepository(pool) })) {
  const router = Router();
  router.use(requireAuth); // ทุก route ในนี้ต้อง login ก่อน

  router.get("/", async (req, res) => {
    res.json(await tasks.listTasks(req.user!));
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
