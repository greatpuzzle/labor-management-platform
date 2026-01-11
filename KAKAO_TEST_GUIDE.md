# 카카오톡 메시지 테스트 가이드

카카오톡 채널 연결 전까지 카카오톡 알림 메시지를 테스트할 수 있는 방법입니다.

## 🎯 테스트 방법

### 방법 1: 어드민 웹에서 계약서 발송 시 자동 미리보기 (가장 쉬움)

1. **어드민 웹에서 계약서 발송**
   - 계약 관리 탭에서 근로자 선택
   - "근로계약서 작성 및 발송" 버튼 클릭
   - 발송 완료 후 **카카오톡 메시지 미리보기 다이얼로그가 자동으로 표시됨**

2. **미리보기 확인**
   - 카카오톡 메시지 형식 확인
   - 수신자 정보 확인
   - 계약서 링크 확인
   - "계약서 링크 테스트" 버튼으로 링크 동작 확인

### 방법 2: 카카오톡 메시지 테스트 페이지 사용

**접속:**
- 로컬: `http://localhost:5173/kakao-test.html`
- 네트워크: `http://192.168.45.78:5173/kakao-test.html`

**사용 방법:**
1. 근로자 이름, 전화번호, 계약서 ID 입력
2. **"메시지 미리보기"** 버튼 클릭
   - 메시지 내용만 확인
3. **"테스트 전송 (Mock)"** 버튼 클릭
   - 실제 Mock 전송 실행
   - 백엔드 콘솔에 로그 출력
   - 메시지 미리보기 표시

### 방법 3: 백엔드 API 직접 호출

**미리보기 API:**
```bash
curl "http://localhost:3000/api/notifications/preview?employeeName=홍길동&employeePhone=010-1234-5678&contractId=test-id"
```

**테스트 전송 API (Mock):**
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "employeeName": "홍길동",
    "employeePhone": "010-1234-5678",
    "contractId": "test-id"
  }'
```

**응답 예시:**
```json
{
  "mock": true,
  "message": "카카오톡 메시지 미리보기 (실제 전송되지 않음)",
  "recipient": {
    "name": "홍길동",
    "phone": "010-1234-5678"
  },
  "kakaoTalkMessage": {
    "template": "[그레이트퍼즐] 근로계약서가 발송되었습니다.",
    "content": "[그레이트퍼즐] 근로계약서가 발송되었습니다.\n\n홍길동님, 근로계약서를 확인하고 서명해주세요.\n\n📋 계약서 확인하기\nhttp://192.168.45.78:5174/contract/test-id\n\n문의: 그레이트퍼즐 고객센터",
    "buttons": [
      {
        "name": "계약서 확인하기",
        "linkType": "WL",
        "linkMo": "http://192.168.45.78:5174/contract/test-id",
        "linkPc": "http://192.168.45.78:5174/contract/test-id"
      }
    ]
  },
  "links": {
    "contract": "http://192.168.45.78:5174/contract/test-id",
    "appInstall": "http://192.168.45.78:5174/download.html?redirect=%2Fcontract%2Ftest-id"
  }
}
```

### 방법 4: 백엔드 콘솔 로그 확인

계약서 발송 시 백엔드 콘솔에 다음 로그가 출력됩니다:

```
[Mock KakaoTalk] 계약서 알림 전송
수신자: 홍길동 (010-1234-5678)
계약서 링크: http://192.168.45.78:5174/contract/clx1234567890
앱 설치 링크: http://192.168.45.78:5174/download.html
```

## 📱 카카오톡 메시지 형식

### 실제 전송될 메시지 내용

```
[그레이트퍼즐] 근로계약서가 발송되었습니다.

{근로자명}님, 근로계약서를 확인하고 서명해주세요.

📋 계약서 확인하기
{계약서링크}

문의: 그레이트퍼즐 고객센터
```

### 버튼

- **"계약서 확인하기"** 버튼 1개
  - 클릭 시: `{MOBILE_APP_URL}/contract/{contractId}`로 이동
  - 앱이 없으면 자동으로 설치 페이지로 리다이렉트

## 🔍 테스트 체크리스트

- [ ] 카카오톡 메시지 미리보기 다이얼로그 표시 확인
- [ ] 메시지 내용이 올바르게 표시되는지 확인
- [ ] 근로자 이름과 전화번호가 정확한지 확인
- [ ] 계약서 링크가 올바른지 확인
- [ ] 계약서 링크 테스트 버튼 작동 확인
- [ ] 백엔드 콘솔에 로그가 출력되는지 확인
- [ ] 카카오톡 테스트 페이지에서 미리보기 확인
- [ ] API 직접 호출 테스트

## 💡 팁

1. **계약서 발송 후 미리보기 확인**
   - 계약서 발송 시 자동으로 미리보기 다이얼로그가 표시됩니다
   - 실제 전송 전에 메시지 내용을 확인할 수 있습니다

2. **백엔드 로그 확인**
   - 백엔드 서버 콘솔에서 실제 전송될 메시지 내용을 확인할 수 있습니다
   - Mock 모드일 경우 "[Mock KakaoTalk]" 로그가 출력됩니다

3. **API 직접 테스트**
   - Postman, curl, 또는 브라우저 개발자 도구로 API 직접 호출 가능
   - 다양한 시나리오 테스트 가능

4. **테스트 페이지 활용**
   - `/kakao-test.html` 페이지에서 다양한 근로자 정보로 테스트
   - 메시지 형식 확인 및 링크 테스트

## ⚠️ 주의사항

1. **개발 모드 (Mock)**
   - 현재는 카카오톡 API 키가 설정되지 않아 Mock 모드로 동작합니다
   - 실제 메시지는 전송되지 않습니다
   - 백엔드 콘솔에 로그만 출력됩니다

2. **카카오톡 채널 연결 후**
   - 16일 이후 카카오톡 채널 연결 완료 시
   - 환경 변수에 실제 API 키 설정
   - 자동으로 실제 메시지 전송으로 전환됨

3. **환경 변수 설정 (16일 이후)**
   ```env
   KAKAO_REST_API_KEY=실제_카카오_REST_API_키
   KAKAO_SENDER_KEY=실제_카카오_발신_프로필_키
   KAKAO_ALIMTALK_TEMPLATE_CODE=실제_템플릿_코드
   KAKAO_CHANNEL_ID=실제_채널_ID
   ```

## 🎯 다음 단계

1. ✅ 카카오톡 메시지 미리보기 기능 구현 완료
2. ✅ 테스트 페이지 생성 완료
3. ⏭️ 16일 카카오톡 채널 연결 완료 대기
4. ⏭️ 환경 변수에 실제 API 키 설정
5. ⏭️ 실제 메시지 전송 테스트

## 📚 관련 파일

- **백엔드 API**: `apps/backend/src/notifications/notifications.controller.ts`
- **서비스**: `apps/backend/src/notifications/notifications.service.ts`
- **테스트 페이지**: `apps/admin/public/kakao-test.html`
- **미리보기 다이얼로그**: `apps/admin/src/app/components/ContractDashboard.tsx`
- **설정 가이드**: `apps/backend/KAKAO_ALIMTALK_SETUP.md`

---

**준비 완료!** 이제 카카오톡 채널 연결 전까지 메시지를 테스트할 수 있습니다! 🎉

