import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { dateInput, optionalText, parse, taskOut, taskPriority, taskStatus } from "../lib/validation.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);
const taskBody = z.object({ projectId: z.string().min(1), name: z.string().trim().min(1).max(160), description: optionalText(10000).transform((v) => v ?? ""), priority: taskPriority.optional(), status: taskStatus.optional(), dueDate: dateInput }).strict();
const taskUpdate = taskBody.omit({ projectId: true }).partial();
const paramId = (req: AuthRequest) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

async function findOwnedTask(taskId: string, ownerId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, project: { ownerId } } });
  if (!task) throw new HttpError(404, "Task not found.");
  return task;
}

tasksRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = typeof req.query.status === "string" && req.query.status ? parse(taskStatus, req.query.status) : undefined;
    const priority = typeof req.query.priority === "string" && req.query.priority ? parse(taskPriority, req.query.priority) : undefined;
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    const tasks = await prisma.task.findMany({ where: { project: { ownerId: req.userId!, ...(projectId ? { id: projectId } : {}) }, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}), ...(status ? { status } : {}), ...(priority ? { priority } : {}) }, include: { project: { select: { id: true, name: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
    res.json({ tasks: tasks.map(taskOut) });
  } catch (error) { next(error); }
});
tasksRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = parse(taskBody, req.body);
    const project = await prisma.project.findFirst({ where: { id: input.projectId, ownerId: req.userId! }, select: { id: true } });
    if (!project) throw new HttpError(404, "Project not found.");
    const { projectId, ...data } = input;
    const task = await prisma.task.create({ data: { ...data, projectId } });
    res.status(201).json({ task: taskOut(task) });
  } catch (error) { next(error); }
});
tasksRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try { res.json({ task: taskOut(await findOwnedTask(paramId(req), req.userId!)) }); } catch (error) { next(error); }
});
tasksRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = parse(taskUpdate, req.body);
    if (!Object.keys(input).length) throw new HttpError(400, "Provide at least one field to update.");
    const existing = await findOwnedTask(paramId(req), req.userId!);
    const task = await prisma.task.update({ where: { id: existing.id }, data: input });
    res.json({ task: taskOut(task) });
  } catch (error) { next(error); }
});
tasksRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await findOwnedTask(paramId(req), req.userId!);
    await prisma.task.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (error) { next(error); }
});
