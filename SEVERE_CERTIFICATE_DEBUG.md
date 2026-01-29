# 중증장애인 확인서 다운로드 디버깅 가이드

## 전체 플로우 확인 단계

### 1단계: 모바일 앱에서 파일 업로드 확인

**확인 위치**: `apps/mobile/src/App.tsx` - `handleEmployeeRegistered` 함수

**확인 사항**:
- `severeCertificateFile`이 전달되는지 확인
- `api.uploadFile`이 성공하는지 확인
- `severeCertificateUrl`이 생성되는지 확인
- `api.createEmployee`에 `severeCertificateUrl`이 포함되는지 확인

**콘솔 로그 확인**:
```javascript
[App] Severe certificate uploaded: <URL>
[App] Employee registered successfully: <ID>
```

---

### 2단계: 백엔드 API에서 데이터 저장 확인

**확인 위치**: `apps/backend/src/employees/employees.service.ts` - `create` 함수

**확인 사항**:
- `CreateEmployeeDto`에 `severeCertificateUrl` 필드가 있는지 확인 ✅
- `employeeData`에 `severeCertificateUrl`이 포함되는지 확인 ✅
- Prisma 스키마에 `severeCertificateUrl` 필드가 있는지 확인 ✅
- 마이그레이션이 적용되었는지 확인 ✅

**데이터베이스 확인** (선택사항):
```sql
SELECT id, name, "severeCertificateUrl" FROM employees WHERE "severeCertificateUrl" IS NOT NULL;
```

---

### 3단계: 백엔드 API 응답 확인

**확인 위치**: `apps/backend/src/employees/employees.service.ts` - `findByCompany` 함수

**확인 사항**:
- `findByCompany`가 모든 필드를 반환하는지 확인 ✅ (Prisma는 기본적으로 모든 필드 반환)
- API 응답에 `severeCertificateUrl`이 포함되는지 확인

**브라우저 콘솔에서 확인**:
```javascript
[DocumentDownload] Raw employee data from API: [...]
[DocumentDownload] Raw employee severeCertificateUrls: [...]
```

---

### 4단계: 프론트엔드에서 API 응답 파싱 확인

**확인 위치**: `apps/admin/src/app/components/DocumentDownloadDashboard.tsx` - `convertApiEmployee` 함수

**확인 사항**:
- `convertApiEmployee`에서 `severeCertificateUrl`을 올바르게 변환하는지 확인 ✅
- 변환된 데이터에 `severeCertificateUrl`이 포함되는지 확인

**브라우저 콘솔에서 확인**:
```javascript
[DocumentDownload] Severe Certificate URLs in converted: [...]
```

---

### 5단계: 필터링 로직 확인

**확인 위치**: `apps/admin/src/app/components/DocumentDownloadDashboard.tsx` - `employeesWithSevereCertificates` 필터

**확인 사항**:
- `filteredEmployees.filter((emp: any) => emp.severeCertificateUrl)`가 올바르게 작동하는지 확인 ✅
- `employeesWithSevereCertificates.length`가 0보다 큰지 확인

**브라우저 콘솔에서 확인**:
```javascript
[DocumentDownload] Severe Certificate URLs: [...]
[DocumentDownload] Employees with severe certificates: [...]
[DocumentDownload] Count - Total: X With severe certificates: Y
```

---

### 6단계: 다운로드 버튼 활성화 확인

**확인 위치**: `apps/admin/src/app/components/DocumentDownloadDashboard.tsx` - 다운로드 버튼

**확인 사항**:
- `disabled={downloadingSevereCertificates || employeesWithSevereCertificates.length === 0}` 조건 확인 ✅
- 버튼이 활성화되어 있는지 확인

---

## 디버깅 체크리스트

1. ✅ 모바일 앱에서 파일 업로드 로직 구현됨
2. ✅ 백엔드 DTO에 `severeCertificateUrl` 필드 추가됨
3. ✅ Prisma 스키마에 `severeCertificateUrl` 필드 추가됨
4. ✅ 마이그레이션 생성 및 적용됨
5. ✅ 프론트엔드에서 API 응답 파싱 로직 구현됨
6. ✅ 필터링 로직 구현됨
7. ✅ 다운로드 함수 구현됨
8. ⏳ 실제 데이터베이스에 데이터가 저장되었는지 확인 필요
9. ⏳ 브라우저 콘솔에서 API 응답 확인 필요

---

## 다음 단계

1. 브라우저 콘솔을 열고 서류 다운로드 탭으로 이동
2. 다음 로그들을 확인:
   - `[DocumentDownload] Raw employee data from API`
   - `[DocumentDownload] Raw employee severeCertificateUrls`
   - `[DocumentDownload] Severe Certificate URLs in converted`
   - `[DocumentDownload] Count - Total: X With severe certificates: Y`
3. 로그 결과를 공유해주시면 문제 지점을 파악할 수 있습니다.
