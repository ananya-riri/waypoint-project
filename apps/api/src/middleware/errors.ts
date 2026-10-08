import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (error instanceof SyntaxError && "status" in error && error.status === 400) return res.status(400).json({ error: "Request body must contain valid JSON." });
  console.error("Unhandled request error", error);
  return res.status(500).json({ error: "An unexpected error occurred." });
}
