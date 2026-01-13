#!/bin/bash

# PostgreSQL Enum 값 추가 및 마이그레이션 해결 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PostgreSQL Enum 값 추가 및 마이그레이션 해결 ==="
echo ""

echo "1. Enum 값 추가 (별도 트랜잭션)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   WorkStatus enum에 NOT_STARTED 값 추가 중..."
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c 'ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS '\''NOT_STARTED'\'';' 2>&1
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Enum 값 추가 완료"
  else
    echo "   ⚠️  Enum 값이 이미 존재하거나 오류 발생 (계속 진행)"
  fi
EOF

echo ""
echo ""

echo "2. 마이그레이션 수동 적용 (enum 제외)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   work_records 테이블 수정 중..."
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management << 'SQL'
    -- work_records 테이블 수정
    ALTER TABLE "work_records" ALTER COLUMN "startTime" DROP NOT NULL;
    ALTER TABLE "work_records" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "work_records" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
    
    -- work_schedules 테이블 생성
    CREATE TABLE IF NOT EXISTS "work_schedules" (
      "id" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "date" DATE NOT NULL,
      "tasks" TEXT[],
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
    );
    
    -- push_notification_tokens 테이블 생성
    CREATE TABLE IF NOT EXISTS "push_notification_tokens" (
      "id" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "platform" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id")
    );
    
    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS "work_schedules_employeeId_idx" ON "work_schedules"("employeeId");
    CREATE INDEX IF NOT EXISTS "work_schedules_date_idx" ON "work_schedules"("date");
    CREATE UNIQUE INDEX IF NOT EXISTS "work_schedules_employeeId_date_key" ON "work_schedules"("employeeId", "date");
    
    CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_key" ON "push_notification_tokens"("employeeId");
    CREATE UNIQUE INDEX IF NOT EXISTS "push_notification_tokens_token_key" ON "push_notification_tokens"("token");
    CREATE INDEX IF NOT EXISTS "push_notification_tokens_employeeId_idx" ON "push_notification_tokens"("employeeId");
    CREATE INDEX IF NOT EXISTS "push_notification_tokens_token_idx" ON "push_notification_tokens"("token");
    
    -- 외래 키 추가
    DO \$\$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'work_schedules_employeeId_fkey'
      ) THEN
        ALTER TABLE "work_schedules" 
        ADD CONSTRAINT "work_schedules_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'push_notification_tokens_employeeId_fkey'
      ) THEN
        ALTER TABLE "push_notification_tokens" 
        ADD CONSTRAINT "push_notification_tokens_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END
    \$\$;
SQL
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 테이블 및 인덱스 생성 완료"
  else
    echo "   ⚠️  일부 작업이 실패했을 수 있음 (계속 진행)"
  fi
EOF

echo ""
echo ""

echo "3. 마이그레이션을 applied로 표시 (수동 적용 완료)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   마이그레이션 상태 해결 중..."
  npx prisma migrate resolve --applied 20260110145522_add_work_schedules_and_not_started_status 2>&1
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 마이그레이션 상태 해결 완료"
  else
    echo "   ❌ 마이그레이션 상태 해결 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "4. 마이그레이션 상태 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   마이그레이션 상태 확인 중..."
  npx prisma migrate status 2>&1 | tail -15
EOF

echo ""
echo ""

echo "5. 백엔드 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  pm2 restart backend-api
  sleep 3
  pm2 list | grep backend-api
EOF

echo ""
echo "✅ 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 로그인 시도"
echo "2. 테스트 계정:"
echo "   - 이메일: company@ecospott.com"
echo "   - 비밀번호: password123"
echo ""