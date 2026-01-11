# 데이터베이스 운영 가이드

## 📊 데이터베이스 구조

### 기술 스택
- **ORM**: Prisma
- **데이터베이스**: PostgreSQL
- **마이그레이션**: Prisma Migrate

### 데이터베이스 스키마

#### 1. Companies (회사)
- 회사 정보 관리
- 사업자 등록번호, 회사명, 대표자, 주소, 전화번호
- 도장 이미지 URL

#### 2. Users (사용자/관리자)
- 어드민 웹 사용자 정보
- 역할: `SUPER_ADMIN` (슈퍼 관리자), `COMPANY_ADMIN` (회사 관리자)
- 회사별 관리자 접근 권한 관리

#### 3. Employees (근로자)
- 근로자 정보 관리
- 개인정보: 이름, 전화번호, 생년월일, 장애 유형 및 등급
- 계약 상태: `DRAFT`, `SENT`, `COMPLETED`
- 근로 조건: 근무시간, 급여, 계약기간

#### 4. Contracts (계약서)
- 근로계약서 관리
- 계약서 상태: `DRAFT`, `SENT`, `COMPLETED`
- 서명 정보: 서명 이미지 URL, PDF URL
- 서명 일시 기록

#### 5. WorkRecords (근로 기록)
- 근로자의 근무 기록
- 근무 시작/종료 시간
- 근무 시간 (분 단위)
- 근무 상태: `IN_PROGRESS`, `COMPLETED`

## 🔄 데이터 흐름

### 1. 근로자 등록 프로세스
```
1. 초대 링크 생성 (회사 ID 포함)
   → Companies 테이블 확인
   
2. 근로자 정보 입력
   → Employees 테이블 생성
   - contractStatus: DRAFT (기본값)
   - 근로 조건은 나중에 어드민이 입력
```

### 2. 계약서 발송 프로세스
```
1. 어드민이 근로 조건 입력 및 계약서 발송
   → Contracts 테이블 생성
   - status: SENT
   - sentAt: 현재 시간
   - sentBy: 어드민 사용자 ID
   
2. Employee 업데이트
   - contractStatus: SENT
   - workingHours, salary, contractPeriod 업데이트
   
3. 카카오톡 알림 전송 (Mock 모드)
   - 실제 전송은 카카오톡 채널 연결 후
```

### 3. 계약서 서명 완료 프로세스
```
1. 근로자가 모바일 앱에서 계약서 확인 및 서명
   → API 호출: POST /api/employees/{employeeId}/contracts/sign
   
2. Contracts 테이블 업데이트
   - status: COMPLETED
   - signatureUrl: 서명 이미지 (Base64)
   - pdfUrl: 계약서 PDF (Base64)
   - signedAt: 현재 시간
   
3. Employee 업데이트
   - contractStatus: COMPLETED
   
✅ 계약 체결 완료 상태로 변경됨
```

### 4. 근로 기록 생성 프로세스
```
1. 근로자가 모바일 앱에서 근무 시작
   → API 호출: POST /api/employees/{employeeId}/work-records
   
2. 계약 체결 완료 여부 확인
   - Employee.contractStatus === 'COMPLETED'
   - 또는 Contracts 테이블에 COMPLETED 상태 계약서 존재
   
3. WorkRecords 테이블 생성
   - employeeId: 근로자 ID
   - date: 근무 날짜 (YYYY-MM-DD)
   - startTime: 근무 시작 시간
   - status: IN_PROGRESS
   
4. 근로자가 근무 종료
   → API 호출: PATCH /api/work-records/{id}
   
5. WorkRecords 테이블 업데이트
   - endTime: 근무 종료 시간
   - duration: 근무 시간 (분 단위)
   - status: COMPLETED
```

### 5. 어드민 대시보드에서 근로 기록 조회
```
1. 어드민이 회사 선택
   → API 호출: GET /api/companies/{companyId}/work-records
   
2. WorkRecords 조회
   - 해당 회사의 모든 근로자 근로 기록 조회
   - Employee와 Company 정보 포함
   - 최신순 정렬
   
3. WorkRecordsDashboard에 표시
   - 날짜별, 근로자별 필터링
   - 근무 시간 통계
```

## 📝 주요 데이터 상태

### ContractStatus (계약 상태)
- **DRAFT**: 초안 (계약서 발송 전)
- **SENT**: 발송됨 (카카오톡 알림 전송 완료)
- **COMPLETED**: 체결 완료 (서명 완료)

### WorkStatus (근무 상태)
- **IN_PROGRESS**: 근무 중 (시작만 하고 종료 안 함)
- **COMPLETED**: 근무 완료 (종료 시간 기록됨)

## 🔍 데이터 확인 방법

### 1. 계약서 서명 완료 확인
```sql
-- 계약 체결 완료된 근로자 조회
SELECT e.*, c.status as contract_status, c.signedAt
FROM employees e
LEFT JOIN contracts c ON c.employeeId = e.id
WHERE e.contractStatus = 'COMPLETED'
   OR c.status = 'COMPLETED';
```

### 2. 근로 기록 조회
```sql
-- 회사별 근로 기록 조회
SELECT wr.*, e.name as employee_name, c.name as company_name
FROM work_records wr
JOIN employees e ON e.id = wr.employeeId
JOIN companies c ON c.id = e.companyId
WHERE e.companyId = '{companyId}'
ORDER BY wr.startTime DESC;
```

### 3. 계약 체결 완료했지만 근로 기록이 없는 근로자
```sql
-- 계약 체결 완료되었지만 근로 기록이 없는 근로자
SELECT e.*
FROM employees e
WHERE e.contractStatus = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1 FROM work_records wr WHERE wr.employeeId = e.id
  );
```

## ⚠️ 중요한 규칙

### 1. 계약서 서명 완료 검증
- 계약서 서명 완료 시 `Contract.status`와 `Employee.contractStatus` 모두 `COMPLETED`로 변경됨
- 두 값이 일치하지 않으면 데이터 불일치 문제

### 2. 근로 기록 생성 제한
- **계약 체결 완료된 근로자만** 근로 기록을 남길 수 있음
- 계약 체결 완료 여부 확인:
  - `Employee.contractStatus === 'COMPLETED'`
  - 또는 `Contracts` 테이블에 `status === 'COMPLETED'`인 계약서 존재

### 3. 데이터 무결성
- 계약서가 삭제되면 (`onDelete: Cascade`) 관련 Contract 자동 삭제
- 근로자가 삭제되면 (`onDelete: Cascade`) 관련 Contract, WorkRecord 자동 삭제

## 🔧 데이터베이스 관리

### 마이그레이션 실행
```bash
cd apps/backend
npx prisma migrate dev
```

### 스키마 변경 후
1. 스키마 수정: `apps/backend/prisma/schema.prisma`
2. 마이그레이션 생성: `npx prisma migrate dev --name migration_name`
3. Prisma Client 재생성: `npx prisma generate`

### 데이터베이스 연결 확인
```bash
cd apps/backend
npx prisma db pull  # 스키마 동기화
npx prisma studio   # 데이터베이스 시각화 (브라우저에서 확인)
```

## 📊 데이터 백업

### PostgreSQL 백업
```bash
# 전체 데이터베이스 백업
pg_dump -U username -d database_name > backup.sql

# 특정 테이블만 백업
pg_dump -U username -d database_name -t employees > employees_backup.sql
```

### 복원
```bash
# 백업 파일로 복원
psql -U username -d database_name < backup.sql
```

## 🐛 문제 해결

### 계약 상태가 업데이트되지 않는 경우
1. `Contract.status` 확인: `COMPLETED`인지 확인
2. `Employee.contractStatus` 확인: `COMPLETED`로 변경되었는지 확인
3. API 호출 확인: 서명 완료 시 `signContract` API가 호출되었는지 확인

### 근로 기록이 어드민에 표시되지 않는 경우
1. WorkRecord 생성 확인: DB에 실제로 저장되었는지 확인
2. 계약 체결 완료 확인: 해당 근로자의 `contractStatus`가 `COMPLETED`인지 확인
3. 회사 ID 확인: 근로 기록 조회 시 올바른 `companyId`로 조회하는지 확인
4. API 엔드포인트 확인: `GET /api/companies/{companyId}/work-records` 호출 확인

### 데이터 불일치 문제
1. Contract와 Employee의 contractStatus 일치 확인
2. WorkRecord의 employeeId와 Employee.id 일치 확인
3. 외래 키 제약 조건 확인

## 📚 관련 파일

- **스키마 정의**: `apps/backend/prisma/schema.prisma`
- **마이그레이션**: `apps/backend/prisma/migrations/`
- **Prisma Service**: `apps/backend/src/prisma/prisma.service.ts`
- **Contract Service**: `apps/backend/src/contracts/contracts.service.ts`
- **Work Record Service**: `apps/backend/src/work-records/work-records.service.ts`

---

**데이터베이스 운영은 Prisma ORM을 통해 관리되며, 모든 데이터 변경은 마이그레이션을 통해 추적됩니다.**

