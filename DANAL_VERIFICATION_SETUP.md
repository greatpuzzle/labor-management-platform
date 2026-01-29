# 포트원(PortOne)을 통한 다날 본인인증 API 연동 가이드

## 개요
포트원(PortOne)을 통해 다날 본인인증 서비스를 모바일 앱에 연동하는 방법입니다.
포트원은 다날을 포함한 여러 PG사의 본인인증을 통합 제공하는 서비스입니다.

## 1. 포트원 계약 및 설정

1. 포트원(PortOne) 계정 생성 및 서비스 이용 계약 체결
2. 포트원 관리자 페이지에서 설정:
   - **API Secret** 발급 (인증용)
   - **본인인증 채널(Channel)** 생성 및 Channel Key 발급
   - 다날 본인인증 서비스 활성화
   - 다날 채널 설정 시 **CPID** 입력 (예: B010008884)

## 2. 필수 패키지 설치

백엔드 디렉토리에서 axios 패키지를 설치하세요:

```bash
cd apps/backend
npm install axios
```

## 3. 환경 변수 설정

백엔드 `.env` 파일에 다음 환경 변수를 추가하세요:

```env
# 포트원 본인인증 API 설정
PORTONE_API_URL=https://api.portone.io
PORTONE_API_SECRET=Q9RJwbmvuXLNTFb0OYUehdIgArvwWV4wLesuOwUxG3I77kbYD5Ikca9gmZroYfsqKQCrqJfzKW15uPHL
PORTONE_CHANNEL_KEY=channel-key-e2221737-003c-401f-86f7-f1bc282dc31e

# 다날 CPID (포트원 채널 설정에 사용)
DANAL_CPID=B010008884
```

**참고**: 
- `PORTONE_API_SECRET`: 포트원 API Secret (결제 API와 동일하게 사용 가능)
- `PORTONE_CHANNEL_KEY`: 포트원 본인인증 채널의 Channel Key
- `DANAL_CPID`: 다날 상점 아이디

## 4. 다날 API 구조

다날 본인인증 API는 다음 단계로 진행합니다:

1. **본인인증 요청**: `POST /verify/request` - 인증번호 발송
2. **본인인증 확인**: `POST /verify/confirm` - 인증번호 검증

### 4.1 API 엔드포인트
- Base URL: `https://api.danalpay.com` (또는 다날에서 제공하는 실제 API URL)
- 본인인증 요청: `/verify/request`
- 본인인증 확인: `/verify/confirm`

### 4.2 요청 파라미터
- **본인인증 요청**: CPID, PWD, PRODUCTCODE, TELNO (핸드폰 번호)
- **본인인증 확인**: CPID, PWD, TID (요청 시 받은 거래 ID), AUTHNO (인증번호)

### 4.3 응답 형식
- 다날 API 응답 형식은 실제 다날 API 문서를 참고해야 합니다.
- 현재 코드는 일반적인 형식으로 작성되었으며, 실제 API 문서에 따라 수정이 필요할 수 있습니다.

## 5. 구현된 기능

### 백엔드
- `POST /api/verification/request`: 본인인증 요청 (인증번호 발송)
- `POST /api/verification/verify`: 본인인증 확인 (인증번호 검증)

### 프론트엔드
- `PhoneLogin.tsx`: 다날 본인인증 API 연동
- 테스트 번호 (010-1234-1234)는 기존 로직 유지

## 6. 테스트 방법

1. 환경 변수 설정
2. 백엔드 서버 재시작
3. 모바일 앱에서 핸드폰 번호 입력
4. 인증번호 발송 확인
5. 인증번호 입력하여 로그인 확인

## 7. 주의사항

- 다날 CPID, PWD, PRODUCTCODE를 반드시 올바르게 설정해야 합니다.
- 실제 다날 API 문서를 확인하여 엔드포인트와 요청/응답 형식이 정확한지 확인하세요.
- 테스트 환경과 운영 환경의 API URL과 인증 정보가 다를 수 있습니다.
- 현재 코드는 일반적인 다날 API 형식을 기준으로 작성되었으며, 실제 API 문서에 따라 수정이 필요할 수 있습니다.

## 8. 다날 API 문서 참고

다날 관리자 페이지와 API 문서를 참고하여 다음을 확인하세요:
- API 엔드포인트 URL (테스트/운영)
- 요청/응답 형식
- 파라미터 이름 및 형식
- 에러 코드 및 메시지
- 응답 필드 이름 (대소문자 등)

다날 개발자센터: https://developers.danalpay.com/
