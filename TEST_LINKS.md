# 테스트 링크 가이드

## 테스트 링크 생성 방법

### 방법 1: 어드민 웹에서 직접 생성 (가장 쉬움)

1. 어드민 웹에 로그인 (`http://localhost:5173`)
2. **"계약 관리"** 탭으로 이동
3. 상단의 **"초대 링크"** 버튼 클릭
4. 링크가 클립보드에 자동 복사됩니다!

### 방법 2: 개발자 도구 콘솔 사용

1. 어드민 웹에 로그인
2. 브라우저 개발자 도구 열기 (F12 또는 Cmd+Option+I)
3. **Console** 탭 클릭
4. 다음 명령어 입력:

```javascript
// 회사 ID 확인 (현재 로그인한 사용자의 회사)
const user = JSON.parse(localStorage.getItem('user'));
console.log('회사 ID:', user.companyId);

// 테스트 링크 생성
showTestLink(user.companyId);
```

### 방법 3: 수동으로 링크 생성

테스트 링크 형식:
```
http://localhost:5174/invite.html?invite={companyId}
```

예시:
```
http://localhost:5174/invite.html?invite=clx1234567890
```

## 테스트 링크 사용 방법

1. **모바일 앱이 실행 중인지 확인**
   ```bash
   cd apps/mobile
   npm run dev
   ```
   → `http://localhost:5174`에서 실행되어야 합니다

2. **테스트 링크 클릭 또는 복사**
   - 링크를 브라우저 주소창에 붙여넣기
   - 또는 모바일 브라우저에서 링크 열기

3. **근로자 등록 페이지 확인**
   - 회사 이름이 표시되어야 합니다
   - 근로자 정보 입력 폼이 나타나야 합니다

## 주의사항

- 모바일 앱 서버가 실행 중이어야 링크가 작동합니다
- 회사 ID는 실제 데이터베이스에 저장된 회사 ID를 사용해야 합니다
- 로컬 개발 환경에서는 `http://localhost:5174`를 사용합니다

## 회사 ID 확인 방법

### 슈퍼 관리자인 경우

1. 어드민 웹에 로그인
2. 상단 드롭다운에서 회사 선택
3. 개발자 도구 콘솔에서:
   ```javascript
   // 선택된 회사 ID 확인
   const selectedCompanyId = '여기에_회사_ID_입력';
   showTestLink(selectedCompanyId);
   ```

### 회사 관리자인 경우

1. 어드민 웹에 로그인
2. 개발자 도구 콘솔에서:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   showTestLink(user.companyId);
   ```

## 빠른 테스트

모바일 앱이 실행 중이라면, 아래 링크 형식으로 테스트할 수 있습니다:

```
http://localhost:5174/invite.html?invite=TEST_COMPANY_ID
```

실제 회사 ID는 어드민 웹에 로그인한 후 확인하세요!

