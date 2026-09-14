import { Router } from "express";
import { z } from "zod";
import { parse } from "../../lib/validate.js";
import { requireAuth } from "../../middleware/require-auth.js";
import * as tasks from "./service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth); // ทุก route ในนี้ต้อง login ก่อน

const createBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});
const idParam = z.object({ id: z.coerce.number().int().positive() });

tasksRouter.get("/", async (req, res) => {
  res.json(await tasks.listTasks(req.user!));
});

tasksRouter.post("/", async (req, res) => {
  const task = await tasks.createTask(req.user!, parse(createBody, req.body));
  res.status(201).json(task);
});

tasksRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await tasks.getTask(id, req.user!));
});

tasksRouter.post("/:id/claim", async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await tasks.claimTask(id, req.user!));
});

tasksRouter.post("/:id/complete", async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await tasks.completeTask(id, req.user!));
});
