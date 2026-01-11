-- Step 1: Add enum value (must be done in separate transaction)
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

-- Step 2: Alter table (can be done after enum value is committed)
ALTER TABLE "work_records" ALTER COLUMN "startTime" DROP NOT NULL;

-- Step 3: Update default value
ALTER TABLE "work_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "work_records" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tasks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_notification_tokens" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_schedules_employeeId_idx" ON "work_schedules"("employeeId");

-- CreateIndex
CREATE INDEX "work_schedules_date_idx" ON "work_schedules"("date");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_employeeId_date_key" ON "work_schedules"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_tokens_employeeId_key" ON "push_notification_tokens"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_tokens_token_key" ON "push_notification_tokens"("token");

-- CreateIndex
CREATE INDEX "push_notification_tokens_employeeId_idx" ON "push_notification_tokens"("employeeId");

-- CreateIndex
CREATE INDEX "push_notification_tokens_token_idx" ON "push_notification_tokens"("token");

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_tokens" ADD CONSTRAINT "push_notification_tokens_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
