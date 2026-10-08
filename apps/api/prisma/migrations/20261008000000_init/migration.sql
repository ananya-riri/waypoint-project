CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "fullName" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "startDate" DATE,
  "endDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Project_ownerId_status_idx" ON "Project"("ownerId", "status");
CREATE INDEX "Project_ownerId_name_idx" ON "Project"("ownerId", "name");

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "dueDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");
CREATE INDEX "Task_projectId_priority_idx" ON "Task"("projectId", "priority");
CREATE INDEX "Task_projectId_name_idx" ON "Task"("projectId", "name");

CREATE TABLE "RevokedToken" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");
