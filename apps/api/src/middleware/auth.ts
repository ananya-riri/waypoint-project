import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errors.js";

export type AuthRequest = Request & { userId?: string; tokenId?: string };

type Claims = jwt.JwtPayload & { sub: string; jti: string };

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new HttpError(401, "Sign in to continue.");
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");
    const claims = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Claims;
    if (!claims.sub || !claims.jti) throw new HttpError(401, "Your session is invalid. Please sign in again.");
    const revoked = await prisma.revokedToken.findUnique({ where: { id: claims.jti } });
    if (revoked) throw new HttpError(401, "Your session has ended. Please sign in again.");
    req.userId = claims.sub;
    req.tokenId = claims.jti;
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return next(new HttpError(401, "Your session expired. Please sign in again."));
    }
    next(error);
  }
}
