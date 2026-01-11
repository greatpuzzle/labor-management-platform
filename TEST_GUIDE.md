# 테스트 가이드

## 📋 완료된 작업 요약

### 백엔드
- ✅ Prisma Schema 수정 (WorkStatus enum, WorkSchedule, PushNotificationToken 모델)
- ✅ WorkScheduleService 및 Controller 생성
- ✅ PushNotificationsService 및 Controller 생성 (Firebase Admin SDK 통합)
- ✅ WorkRecordsService 수정 (NOT_STARTED 상태 처리)

### 프론트엔드 (모바일 앱)
- ✅ 하단 탭바 네비게이션 (`BottomTabBar`)
- ✅ Splash & Auto Login (localStorage 기반 영구 로그인)
- ✅ MainHome 컴포넌트 (출근 전/근무 중/퇴근 시 상태별 UI)
- ✅ Payroll 컴포넌트 (근무 일수 달력)
- ✅ MyPage 컴포넌트 (계약서 확인, 내 정보, 관리자 전화)
- ✅ App.tsx 라우팅 변경 (탭바 기반 네비게이션)
- ✅ Push Notifications 초기화 로직 (Capacitor Push Notifications 플러그인)

## 🔧 테스트 전 준비사항

### 1. 데이터베이스 마이그레이션 적용

⚠️ **중요**: PostgreSQL enum 값 추가 문제로 수동 적용이 필요할 수 있습니다.

```bash
cd apps/backend

# 방법 1: 제공된 SQL 스크립트 사용
psql -h localhost -U your_username -d labor_management -f scripts/apply-migration.sql

# 방법 2: Prisma 사용 (enum 값은 먼저 수동으로 추가)
# 1. PostgreSQL에서 직접 실행:
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';

# 2. Prisma 마이그레이션 적용:
npx prisma migrate deploy
```

상세 가이드: [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)

### 2. 백엔드 서버 실행

```bash
cd apps/backend
npm run start:dev
```

서버가 정상적으로 시작되면 마이그레이션이 성공적으로 적용된 것입니다.

### 3. 모바일 앱 개발 서버 실행

```bash
cd apps/mobile
npm run dev
```

## 🧪 테스트 시나리오

### 시나리오 1: 근로자 등록 및 계약서 서명 플로우

1. **초대 링크 접속**
   - 브라우저/모바일에서 `http://localhost:5174?invite=회사ID` 접속
   - 또는 `http://192.168.45.78:5174?invite=회사ID` (로컬 네트워크)

2. **근로자 등록**
   - 개인정보 입력
   - 장애 정보 입력
   - 등록 완료
   - ✅ localStorage에 `employeeId`, `employeeName`, `companyName` 저장 확인

3. **계약서 발송 대기**
   - 메인 화면 표시 (계약서 발송 대기 중)
   - ✅ 하단 탭바 표시 확인 (홈, 근무기록, 내정보)

4. **관리자가 계약서 발송** (어드민 웹에서)
   - 어드민 > 계약 관리 > 근로자 선택 > 계약서 발송
   - 카카오톡 알림 전송 (Mock 모드)

5. **계약서 링크 클릭** (카카오톡 또는 테스트 링크)
   - `http://localhost:5174/contract/계약서ID` 접속
   - 계약서 확인 및 서명
   - ✅ 계약서 서명 완료 후 메인 화면으로 이동

6. **Push Notification 토큰 등록**
   - 계약서 서명 완료 후 자동으로 Push Notification 초기화
   - ✅ 네이티브 앱에서 토큰이 백엔드에 등록되는지 확인 (콘솔 로그)

### 시나리오 2: 출근 및 근무 기록

1. **출근하기**
   - 메인 화면 (Tab 1: 홈)에서 "출근하기" 버튼 클릭
   - ✅ WorkRecord 생성 (status: IN_PROGRESS)
   - ✅ 타이머 표시 확인 (02:34:10 형식)

2. **근무 중 상태**
   - 현재 업무 텍스트 표시 ("현재 RVM 관리 업무 수행 중입니다.")
   - "긴급 상황/불편 신고" 버튼 표시
   - ✅ 타이머가 1초마다 업데이트되는지 확인

3. **퇴근하기**
   - 하단 고정된 "퇴근하기" 버튼 클릭
   - "특이사항 확인" 다이얼로그 표시
   - ✅ "없음 (업무 완료)" 클릭 시 WorkRecord 완료 처리
   - ✅ "있음" 클릭 시 사유 선택 (기계고장/아픔) → 관리자 알림

4. **퇴근 완료**
   - "수고하셨습니다!" 화면 표시
   - ✅ 오늘 근무 시간 표시

### 시나리오 3: 근무 기록 확인 (Payroll Tab)

1. **근무기록 탭 (Tab 2)**
   - 달력 표시
   - ✅ 근무 완료한 날짜에 체크 표시 (초록색)
   - ✅ 근무 중인 날짜에 진행 중 표시 (노란색)
   - ✅ 미완료 날짜에 X 표시 (회색)
   - ✅ 근무 일수 집계 확인

2. **월 변경**
   - 이전/다음 월 버튼으로 이동
   - ✅ 각 월별 근무 기록 로드 확인

### 시나리오 4: 내 정보 (MyPage Tab)

1. **내정보 탭 (Tab 3)**
   - 프로필 카드 표시
   - ✅ 근로계약서 확인 버튼 (서명 완료된 계약서 표시)
   - ✅ 내 정보 버튼
   - ✅ 관리자 전화 연결 버튼 (`tel:` 링크)
   - ✅ 로그아웃 버튼 (localStorage 초기화)

### 시나리오 5: 일주일치 업무 스케줄 생성 및 Push Notification

1. **일주일치 업무 스케줄 생성** (어드민에서)
   - API 호출: `POST /api/work-schedules/:employeeId/weekly`
   - ✅ 7일치 업무 스케줄 생성 확인 (매일 랜덤 4개 업무)

2. **오늘 업무 확인** (모바일 앱)
   - 메인 화면에서 오늘 업무 스케줄 로드
   - ✅ "오늘 예정된 업무가 2건 있습니다." 표시
   - ✅ 업무 목록 표시 (페트병 수거기기 작동 확인, 분쇄 페트 저장량 확인 등)

3. **Push Notification 전송** (스케줄 생성 시)
   - 오늘 날짜에 대한 Push Notification 자동 전송
   - ✅ Mock 모드: 콘솔에 로그 출력
   - ✅ 실제 모드: Firebase를 통해 알림 전송

## 🐛 알려진 이슈 및 해결 방법

### 1. 데이터베이스 마이그레이션 오류

**증상**: `unsafe use of new value "NOT_STARTED" of enum type "WorkStatus"`

**해결**: 
```sql
-- PostgreSQL에서 직접 실행
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
```

### 2. Push Notification 토큰 등록 실패

**증상**: 앱에서 토큰이 등록되지 않음

**해결**:
- 앱이 Capacitor 네이티브 앱으로 빌드되었는지 확인 (웹에서는 Push Notifications 미지원)
- 백엔드 서버 실행 확인
- 네트워크 연결 확인

### 3. Firebase Admin SDK 초기화 실패

**증상**: 백엔드에서 Firebase 초기화 오류

**해결**:
- `FIREBASE_SERVICE_ACCOUNT_PATH` 또는 `FIREBASE_SERVICE_ACCOUNT_JSON` 환경 변수 확인
- 서비스 계정 키 파일 경로 확인
- Mock 모드로 작동하는지 확인 (콘솔 로그 확인)

### 4. 탭바가 보이지 않음

**증상**: 하단 탭바가 표시되지 않음

**해결**:
- `appState === 'main'` 상태인지 확인
- `employeeId`와 `employeeName`이 설정되어 있는지 확인
- 브라우저 개발자 도구에서 에러 확인

## 📝 체크리스트

테스트 전 확인사항:

- [ ] 데이터베이스 마이그레이션 적용 완료
- [ ] 백엔드 서버 실행 중 (`http://localhost:3000`)
- [ ] 모바일 앱 개발 서버 실행 중 (`http://localhost:5174`)
- [ ] PostgreSQL 데이터베이스 연결 확인
- [ ] Firebase 설정 (선택사항, Mock 모드로도 테스트 가능)

테스트 시 확인사항:

- [ ] 근로자 등록 플로우 정상 작동
- [ ] 계약서 서명 플로우 정상 작동
- [ ] 하단 탭바 네비게이션 정상 작동
- [ ] 출근/퇴근 기능 정상 작동
- [ ] 근무 기록 달력 정상 표시
- [ ] Push Notification 토큰 등록 (네이티브 앱에서만)
- [ ] 일주일치 업무 스케줄 생성 및 조회

## 🚀 다음 단계

1. **어드민 웹에서 일주일치 업무 스케줄 생성 기능 추가**
   - 계약 관리 탭에서 "일주일치 업무 생성" 버튼 추가
   - 선택한 근로자에게 자동으로 일주일치 업무 스케줄 생성

2. **매일 오전 9시 자동 Push Notification (Cron Job)**
   - `@nestjs/schedule` 패키지 추가
   - Cron job으로 매일 오전 9시에 모든 근로자에게 업무 알림 전송

3. **관리자 페이지에서 Push Notification 수동 전송**
   - 근로자별 Push Notification 전송 기능
   - 일괄 전송 기능

## 📚 참고 문서

- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - 데이터베이스 마이그레이션 상세 가이드
- [PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md) - Push Notification 설정 상세 가이드
- [MIGRATION_AND_PUSH_NOTIFICATION_SETUP.md](./MIGRATION_AND_PUSH_NOTIFICATION_SETUP.md) - 통합 가이드

