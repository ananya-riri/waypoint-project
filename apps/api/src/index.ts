import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: "apps/api/.env" });
dotenv.config({ path: ".env" });
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { errorHandler } from "./middleware/errors.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => console.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`));
  next();
});
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/dashboard", dashboardRouter);
app.use(errorHandler);

app.listen(port, () => console.info(`Waypoint API listening on port ${port}`));
