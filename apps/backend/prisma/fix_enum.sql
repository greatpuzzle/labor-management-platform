-- Fix WorkStatus enum and create missing tables
-- Run this manually if migration fails

-- Step 1: Add enum value (run this first separately)
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

-- Step 2: Alter table
ALTER TABLE "work_records" ALTER COLUMN "startTime" DROP NOT NULL;
ALTER TABLE "work_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "work_records" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- Step 3: Create work_schedules table if not exists
CREATE TABLE IF NOT EXISTS "work_schedules" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tasks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create push_notification_tokens table if not exists
CREATE TABLE IF NOT EXISTS "push_notification_tokens" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create indexes if not exists
CREATE INDEX IF NOT EXISTS "work_schedules_employeeId_idx" ON "work_schedules"("employeeId");
CREATE INDEX IF NOT EXISTS "work_schedules_date_idx" ON "work_schedules"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "work_schedules_employeeId_date_key" ON "work_schedules"("employeeId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_key" ON "push_notification_tokens"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_token_key" ON "push_notification_tokens"("token");
CREATE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_idx" ON "push_notification_tokens"("employeeId");
CREATE INDEX IF NOT EXISTS "push_notification_tokens_token_idx" ON "push_notification_tokens"("token");

-- Step 6: Add foreign keys if not exists (need to check if columns exist first)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'work_schedules_employeeId_fkey'
    ) THEN
        ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'push_notification_tokens_employeeId_fkey'
    ) THEN
        ALTER TABLE "push_notification_tokens" ADD CONSTRAINT "push_notification_tokens_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

