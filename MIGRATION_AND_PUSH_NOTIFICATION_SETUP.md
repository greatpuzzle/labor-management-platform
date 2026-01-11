# 데이터베이스 마이그레이션 및 Push Notification 설정 가이드

## 1. 데이터베이스 마이그레이션 적용

### 방법 1: 수동 SQL 실행 (권장)

PostgreSQL에 직접 접속하여 마이그레이션 스크립트 실행:

```bash
cd apps/backend
psql -h localhost -U your_username -d labor_management -f scripts/apply-migration.sql
```

또는 PostgreSQL 클라이언트에서 직접:

```sql
-- Step 1: Enum 값 추가 (먼저 실행)
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

-- Step 2-6: 나머지 명령들은 scripts/apply-migration.sql 파일 참조
```

### 방법 2: Prisma Migrate 사용

```bash
cd apps/backend

# 1. Enum 값을 먼저 수동으로 추가 (PostgreSQL에서)
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

# 2. 마이그레이션 적용
npx prisma migrate deploy

# 또는 개발 환경에서
npx prisma migrate dev
```

### 확인 방법

```bash
cd apps/backend
npx prisma migrate status
npx prisma db pull
```

다음이 생성되어 있어야 합니다:
- ✅ `WorkStatus` enum에 `NOT_STARTED` 값 추가
- ✅ `work_schedules` 테이블 생성
- ✅ `push_notification_tokens` 테이블 생성
- ✅ `work_records.startTime` NULL 허용
- ✅ `work_records.status` 기본값 `NOT_STARTED`

## 2. Push Notification 설정

### 2.1 Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Android 앱 추가 (패키지명: `com.ecospott.labor`)
3. `google-services.json` 다운로드 → `apps/mobile/android/app/google-services.json`에 복사

### 2.2 Firebase Admin SDK 설정

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" → JSON 파일 다운로드
3. `apps/backend/.env` 파일에 추가:

```env
# 방법 1: 파일 경로 지정
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json

# 방법 2: JSON 문자열 (환경 변수에 직접 입력)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

⚠️ **보안**: `.env` 파일은 Git에 커밋하지 마세요!

### 2.3 Android 빌드

```bash
cd apps/mobile
npm run android:build
```

### 2.4 Mock 모드 (Firebase 설정 없이)

Firebase 설정 없이도 앱은 작동하며, Push Notification은 Mock 모드로 실행됩니다 (콘솔에 로그만 출력).

## 3. 테스트 절차

### 3.1 데이터베이스 마이그레이션 확인

```bash
cd apps/backend
npm run start:dev
# 서버가 정상적으로 시작되면 마이그레이션 성공
```

### 3.2 Push Notification 테스트

1. **백엔드 서버 시작**:
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **모바일 앱 빌드 및 실행**:
   ```bash
   cd apps/mobile
   npm run dev
   # 또는 네이티브 앱으로 빌드
   npm run android:build
   ```

3. **계약서 서명 완료** 후 자동으로 Push Notification 토큰이 등록됩니다.

4. **일주일치 업무 스케줄 생성**:
   - 어드민에서 근로자 선택
   - 일주일치 업무 스케줄 생성 API 호출
   - 오늘 날짜에 대한 Push Notification이 자동 전송 (Mock 모드에서는 콘솔에 로그만 출력)

## 4. 문제 해결

### 4.1 마이그레이션 오류

**오류**: `unsafe use of new value "NOT_STARTED" of enum type "WorkStatus"`

**해결**: Enum 값을 먼저 별도 트랜잭션에서 추가해야 합니다:

```sql
-- PostgreSQL에서 직접 실행
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
```

그 다음 Prisma 마이그레이션 실행:

```bash
npx prisma migrate deploy
```

### 4.2 Push Notification 토큰 등록 실패

- 네트워크 연결 확인
- 백엔드 서버 실행 확인
- 앱이 Capacitor 네이티브 앱으로 빌드되었는지 확인 (웹에서는 Push Notifications 미지원)

### 4.3 Firebase Admin SDK 초기화 실패

- `FIREBASE_SERVICE_ACCOUNT_PATH` 또는 `FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수 확인
- 서비스 계정 키 파일 경로 확인
- JSON 형식 확인

## 5. 다음 단계

1. ✅ 데이터베이스 마이그레이션 적용
2. ✅ Push Notification 기본 설정
3. ⏳ Firebase 프로젝트 설정 (필요 시)
4. ⏳ 일주일치 업무 스케줄 생성 기능 (어드민에서)
5. ⏳ 매일 오전 9시 자동 Push Notification (Cron Job 설정)

## 6. 참고 문서

- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - 상세한 마이그레이션 가이드
- [PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md) - 상세한 Push Notification 설정 가이드

