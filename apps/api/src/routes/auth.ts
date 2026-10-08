import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

export const authRouter = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many authentication attempts. Try again in 15 minutes." } });
const registerSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
}).strict();
const loginSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) }).strict();

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, result.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; "));
  return result.data;
}

function issueToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  const tokenId = randomUUID();
  const token = jwt.sign({}, secret, { algorithm: "HS256", subject: userId, jwtid: tokenId, expiresIn: "1h" });
  return { token, tokenId };
}

authRouter.post("/register", authLimit, async (req, res, next) => {
  try {
    const input = parse(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, "An account with that email already exists.");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { fullName: input.fullName, email: input.email, passwordHash }, select: { id: true, fullName: true, email: true, createdAt: true } });
    const session = issueToken(user.id);
    res.status(201).json({ token: session.token, user });
  } catch (error) { next(error); }
});

authRouter.post("/login", authLimit, async (req, res, next) => {
  try {
    const input = parse(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, "Email or password is incorrect.");
    const session = issueToken(user.id);
    res.json({ token: session.token, user: { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, fullName: true, email: true, createdAt: true } });
    if (!user) throw new HttpError(401, "Your account could not be found. Please sign in again.");
    res.json({ user });
  } catch (error) { next(error); }
});

authRouter.post("/logout", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const decoded = jwt.decode(req.headers.authorization!.slice(7)) as jwt.JwtPayload;
    await prisma.revokedToken.create({ data: { id: req.tokenId!, expiresAt: new Date((decoded.exp ?? 0) * 1000) } });
    res.json({ message: "Signed out successfully." });
  } catch (error) { next(error); }
});
