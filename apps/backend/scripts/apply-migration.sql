-- 데이터베이스 마이그레이션 적용 스크립트
-- 이 스크립트는 PostgreSQL에서 직접 실행해야 합니다.

-- Step 1: Enum 값 추가 (별도 트랜잭션에서 실행)
-- 주의: 이 명령은 트랜잭션 내에서 실행할 수 없으므로, 별도로 실행해야 합니다.
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

-- Step 2: work_records 테이블 수정
ALTER TABLE "work_records" 
  ALTER COLUMN "startTime" DROP NOT NULL;

ALTER TABLE "work_records" 
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "work_records" 
  ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- Step 3: work_schedules 테이블 생성
CREATE TABLE IF NOT EXISTS "work_schedules" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tasks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- Step 4: push_notification_tokens 테이블 생성
CREATE TABLE IF NOT EXISTS "push_notification_tokens" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id")
);

-- Step 5: Indexes 생성
CREATE INDEX IF NOT EXISTS "work_schedules_employeeId_idx" ON "work_schedules"("employeeId");
CREATE INDEX IF NOT EXISTS "work_schedules_date_idx" ON "work_schedules"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "work_schedules_employeeId_date_key" ON "work_schedules"("employeeId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_key" ON "push_notification_tokens"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_token_key" ON "push_notification_tokens"("token");
CREATE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_idx" ON "push_notification_tokens"("employeeId");
CREATE INDEX IF NOT EXISTS "push_notification_tokens_token_idx" ON "push_notification_tokens"("token");

-- Step 6: Foreign Keys 추가 (존재하지 않는 경우만)
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

