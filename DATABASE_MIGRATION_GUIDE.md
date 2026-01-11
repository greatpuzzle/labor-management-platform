# 데이터베이스 마이그레이션 가이드

## 문제 상황

PostgreSQL에서 enum 값을 추가할 때는 트랜잭션 내에서 안전하게 처리할 수 없습니다. 따라서 `WorkStatus` enum에 `NOT_STARTED` 값을 추가하는 마이그레이션이 실패할 수 있습니다.

## 해결 방법

### 방법 1: 수동 SQL 실행 (권장)

1. PostgreSQL에 직접 접속하여 enum 값을 먼저 추가:

```sql
-- Step 1: Enum 값 추가 (별도 트랜잭션)
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
```

2. 마이그레이션 파일 실행:

```bash
cd apps/backend
npx prisma migrate deploy
```

### 방법 2: 제공된 SQL 스크립트 사용

```bash
cd apps/backend
# PostgreSQL에 직접 접속하여 실행
psql -h localhost -U your_username -d labor_management -f prisma/fix_enum.sql
```

또는 Prisma를 통해 실행:

```bash
cd apps/backend
npx prisma db execute --file prisma/fix_enum.sql
```

### 방법 3: 마이그레이션 리셋 (개발 환경에서만)

⚠️ **주의: 이 방법은 모든 데이터를 삭제합니다. 프로덕션에서는 사용하지 마세요.**

```bash
cd apps/backend
npx prisma migrate reset
```

## 확인 방법

마이그레이션이 성공적으로 적용되었는지 확인:

```bash
cd apps/backend
npx prisma migrate status
npx prisma db pull
```

`WorkStatus` enum에 `NOT_STARTED`가 포함되어 있고, `work_schedules`와 `push_notification_tokens` 테이블이 생성되어 있어야 합니다.

## 필요한 테이블 및 컬럼

다음 테이블과 컬럼이 생성되어 있어야 합니다:

1. **work_schedules** 테이블
   - `id`, `employeeId`, `date`, `tasks[]`, `createdAt`, `updatedAt`
   - Unique constraint: `(employeeId, date)`

2. **push_notification_tokens** 테이블
   - `id`, `employeeId`, `token`, `platform`, `createdAt`, `updatedAt`
   - Unique constraint: `employeeId`, `token`

3. **work_records** 테이블 수정
   - `startTime`: `NOT NULL` 제거
   - `status`: 기본값 `NOT_STARTED`로 변경

## 문제 해결

마이그레이션이 실패하는 경우:

1. **Enum 값이 이미 존재하는 경우**: `IF NOT EXISTS`를 사용하므로 안전하게 재실행 가능합니다.

2. **테이블이 이미 존재하는 경우**: `CREATE TABLE IF NOT EXISTS`를 사용하므로 안전하게 재실행 가능합니다.

3. **외래키 제약조건 오류**: `fix_enum.sql` 스크립트는 이미 존재하는 제약조건을 확인하고 있으므로 안전합니다.

## 참고

- 마이그레이션 파일 위치: `apps/backend/prisma/migrations/20260110145522_add_work_schedules_and_not_started_status/migration.sql`
- 수동 SQL 스크립트: `apps/backend/prisma/fix_enum.sql`

