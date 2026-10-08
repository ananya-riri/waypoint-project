import { z } from "zod";
import { HttpError } from "../middleware/errors.js";

export function parse<S extends z.ZodTypeAny>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(400, result.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  return result.data;
}

export const projectStatus = z.enum(["Not Started", "In Progress", "Completed"]).transform((v): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" => v === "Not Started" ? "NOT_STARTED" : v === "In Progress" ? "IN_PROGRESS" : "COMPLETED");
export const taskStatus = z.enum(["Pending", "In Progress", "Completed"]).transform((v): "PENDING" | "IN_PROGRESS" | "COMPLETED" => v === "Pending" ? "PENDING" : v === "In Progress" ? "IN_PROGRESS" : "COMPLETED");
export const taskPriority = z.enum(["Low", "Medium", "High"]).transform((v): "LOW" | "MEDIUM" | "HIGH" => v === "Low" ? "LOW" : v === "Medium" ? "MEDIUM" : "HIGH");
export const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`)) && new Date(`${s}T00:00:00.000Z`).toISOString().slice(0, 10) === s, "must be a valid YYYY-MM-DD date").transform((v) => new Date(`${v}T00:00:00.000Z`)).nullable().optional();
export const optionalText = (max: number) => z.string().trim().max(max).optional();

export function projectOut<T extends { status: string }>(project: T) {
  const status = ({ NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress", COMPLETED: "Completed" } as Record<string, string>)[project.status] ?? project.status;
  return { ...project, status };
}
export function taskOut<T extends { status: string; priority: string }>(task: T) {
  return { ...task, status: ({ PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" } as Record<string, string>)[task.status] ?? task.status, priority: task.priority[0] + task.priority.slice(1).toLowerCase() };
}
