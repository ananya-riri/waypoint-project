import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { dateInput, optionalText, parse, projectOut, projectStatus } from "../lib/validation.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);
const projectBody = z.object({ name: z.string().trim().min(1).max(160), description: optionalText(10000).transform((v) => v ?? ""), status: projectStatus.optional(), startDate: dateInput, endDate: dateInput }).strict();
const paramId = (req: AuthRequest) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

projectsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const statusArg = typeof req.query.status === "string" && req.query.status ? parse(projectStatus, req.query.status) : undefined;
    const projects = await prisma.project.findMany({ where: { ownerId: req.userId!, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}), ...(statusArg ? { status: statusArg } : {}) }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { tasks: true } } } });
    res.json({ projects: projects.map(projectOut) });
  } catch (error) { next(error); }
});
projectsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = parse(projectBody, req.body);
    if (input.startDate && input.endDate && input.endDate < input.startDate) throw new HttpError(400, "endDate must be on or after startDate.");
    const project = await prisma.project.create({ data: { ...input, ownerId: req.userId! } });
    res.status(201).json({ project: projectOut(project) });
  } catch (error) { next(error); }
});
projectsRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: paramId(req), ownerId: req.userId! }, include: { tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }] } } });
    if (!project) throw new HttpError(404, "Project not found.");
    res.json({ project: { ...projectOut(project), tasks: project.tasks.map((t) => ({ ...t, status: ({ PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" } as Record<string, string>)[t.status], priority: t.priority[0] + t.priority.slice(1).toLowerCase() })) } });
  } catch (error) { next(error); }
});
projectsRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = parse(projectBody.partial(), req.body);
    if (Object.keys(input).length === 0) throw new HttpError(400, "Provide at least one field to update.");
    const existing = await prisma.project.findFirst({ where: { id: paramId(req), ownerId: req.userId! } });
    if (!existing) throw new HttpError(404, "Project not found.");
    const start = input.startDate === undefined ? existing.startDate : input.startDate;
    const end = input.endDate === undefined ? existing.endDate : input.endDate;
    if (start && end && end < start) throw new HttpError(400, "endDate must be on or after startDate.");
    const project = await prisma.project.update({ where: { id: existing.id }, data: input });
    res.json({ project: projectOut(project) });
  } catch (error) { next(error); }
});
projectsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.project.deleteMany({ where: { id: paramId(req), ownerId: req.userId! } });
    if (!result.count) throw new HttpError(404, "Project not found.");
    res.status(204).end();
  } catch (error) { next(error); }
});
