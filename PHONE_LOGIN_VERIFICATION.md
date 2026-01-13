# 핸드폰 번호 로그인 백엔드 연동 확인

## ✅ 백엔드 API 확인

### 엔드포인트
- **URL:** `POST /api/employees/login-by-phone`
- **인증:** 불필요 (`@Public()` 데코레이터)
- **요청 Body:**
  ```json
  {
    "phone": "010-1234-5678"
  }
  ```
- **응답:**
  ```json
  {
    "employee": {
      "id": "...",
      "name": "...",
      "phone": "...",
      "company": {
        "id": "...",
        "name": "..."
      }
    },
    "message": "로그인 성공"
  }
  ```

### 서비스 로직
- `employees.service.ts`의 `findByPhone` 메서드 사용
- 전화번호 정규화 (하이픈 제거)
- 다양한 형식으로 검색 시도:
  - 원본 번호
  - 하이픈 제거된 번호
  - 하이픈 추가된 번호

## ✅ 프론트엔드 연동 확인

### API 클라이언트
- `packages/shared/api.ts`에 `loginByPhone` 메서드 추가됨
- 엔드포인트: `/api/employees/login-by-phone`
- 요청 형식: `{ phone: string }`

### 컴포넌트
- `apps/mobile/src/components/PhoneLogin.tsx` 생성됨
- `api.loginByPhone(phone)` 호출
- 로그인 성공 시:
  - localStorage에 저장
  - `onLoginSuccess` 콜백 호출
  - 메인 화면으로 이동

## ✅ 연동 상태

**백엔드:** ✅ 구현 완료
- 엔드포인트 존재
- 서비스 로직 구현됨
- 에러 처리 포함

**프론트엔드:** ✅ 구현 완료
- API 클라이언트 메서드 추가됨
- UI 컴포넌트 생성됨
- App.tsx에 통합됨

## 테스트 방법

1. 앱 실행
2. 핸드폰 번호 입력 (예: 010-1234-5678)
3. 로그인 버튼 클릭
4. 등록된 번호면 → 로그인 성공, 메인 화면 이동
5. 등록되지 않은 번호면 → 에러 메시지 표시

## 주의사항

- 핸드폰 번호는 회사의 초대 링크를 통해 먼저 등록되어 있어야 합니다
- 전화번호 형식은 자동으로 하이픈이 추가됩니다 (010-1234-5678)
- 백엔드에서 다양한 형식으로 검색하므로 하이픈 유무는 상관없습니다
