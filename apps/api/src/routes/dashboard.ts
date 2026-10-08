import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks] = await Promise.all([
      prisma.project.count({ where: { ownerId: req.userId! } }),
      prisma.project.count({ where: { ownerId: req.userId!, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { project: { ownerId: req.userId! } } }),
      prisma.task.count({ where: { project: { ownerId: req.userId! }, status: "COMPLETED" } }),
      prisma.task.count({ where: { project: { ownerId: req.userId! }, status: "PENDING" } })
    ]);
    res.json({ totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress });
  } catch (error) { next(error); }
});
