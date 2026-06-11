-- Migration: add scope, inputs, partial status, duration
-- Run this against your Neon/PostgreSQL database

-- WorkflowRun: add scope and duration columns
ALTER TABLE "WorkflowRun"
  ADD COLUMN IF NOT EXISTS "scope"    TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS "duration" DOUBLE PRECISION;

-- NodeRun: rename input → inputs (keep old column as fallback)
ALTER TABLE "NodeRun"
  ADD COLUMN IF NOT EXISTS "inputs" JSONB;

-- Copy existing input data into inputs
UPDATE "NodeRun" SET "inputs" = "input" WHERE "input" IS NOT NULL;

-- NodeRun: make startedAt nullable (was NOT NULL with default)
ALTER TABLE "NodeRun"
  ALTER COLUMN "startedAt" DROP NOT NULL,
  ALTER COLUMN "startedAt" DROP DEFAULT;
