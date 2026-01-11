# 모바일 기기 접속 링크

## 📱 현재 네트워크 정보

- **컴퓨터 IP 주소**: `192.168.45.78`
- **모바일 앱 서버 포트**: `5174`

## 🔗 모바일 기기 접속 링크

### 1. 초대 링크 (근로자 등록용)

```
http://192.168.45.78:5174/invite.html?invite={companyId}
```

**회사 ID 확인 방법:**
1. 어드민 웹에 로그인 (`http://192.168.45.78:5173` 또는 `http://localhost:5173`)
2. 개발자 도구 콘솔 열기 (F12 또는 Cmd+Option+I)
3. 다음 명령어 입력:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('회사 ID:', user.companyId);
   ```
4. 확인된 회사 ID를 위 링크의 `{companyId}` 부분에 입력

**예시:**
```
http://192.168.45.78:5174/invite.html?invite=clx1234567890
```

### 2. 계약서 링크

```
http://192.168.45.78:5174/contract/{contractId}
```

**계약서 ID 확인 방법:**
- 어드민 웹에서 계약서 발송 시 생성된 계약서 ID 사용
- 또는 백엔드 API에서 계약서 목록 조회

**예시:**
```
http://192.168.45.78:5174/contract/clx9876543210
```

### 3. 앱 설치 안내 페이지

```
http://192.168.45.78:5174/download.html
```

리다이렉트 포함:
```
http://192.168.45.78:5174/download.html?redirect=/contract/{contractId}
```

### 4. 메인 앱 페이지

```
http://192.168.45.78:5174/
```

## 📋 빠른 링크 생성 방법

### 어드민 웹에서 자동 생성 (가장 쉬움)

1. 어드민 웹에 로그인 (`http://localhost:5173`)
2. **"계약 관리"** 탭으로 이동
3. 상단의 **"초대 링크"** 버튼 클릭
4. 클립보드에 복사된 링크 확인
5. `localhost`를 `192.168.45.78`로 변경

**예시:**
- 복사된 링크: `http://localhost:5174/invite.html?invite=clx1234567890`
- 변경 후: `http://192.168.45.78:5174/invite.html?invite=clx1234567890`

### 개발자 도구 콘솔에서 생성

어드민 웹 개발자 도구 콘솔에서:

```javascript
// 회사 ID 확인
const user = JSON.parse(localStorage.getItem('user'));
const companyId = user.companyId;

// 모바일 접속 링크 생성
const mobileLink = `http://192.168.45.78:5174/invite.html?invite=${companyId}`;
console.log('📱 모바일 접속 링크:', mobileLink);

// 클립보드에 복사
navigator.clipboard.writeText(mobileLink).then(() => {
  console.log('✅ 링크가 클립보드에 복사되었습니다!');
});
```

## ⚠️ 중요 사항

### 네트워크 연결 확인

1. **컴퓨터와 모바일 기기가 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다**
2. 방화벽에서 포트 5174가 허용되어야 합니다
3. 모바일 앱 서버가 실행 중이어야 합니다:
   ```bash
   cd apps/mobile
   npm run dev
   ```

### 포트 포워딩 (필요한 경우)

모바일 기기에서 접속이 안 되는 경우:

1. **방화벽 설정 확인 (macOS):**
   ```bash
   # 방화벽 상태 확인
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   
   # 포트 허용 (필요한 경우)
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/node
   ```

2. **Vite 서버 설정 확인:**
   - `apps/mobile/vite.config.ts`에서 `host: true` 설정 확인

### IP 주소 변경 시

컴퓨터 IP 주소가 변경된 경우:

1. 새 IP 주소 확인:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   또는:
   ```bash
   ipconfig getifaddr en0
   ```

2. 위의 모든 링크에서 `192.168.45.78`를 새 IP로 변경

## 🧪 테스트 체크리스트

- [ ] 컴퓨터와 모바일 기기가 같은 Wi-Fi에 연결됨
- [ ] 모바일 앱 서버 실행 중 (`http://192.168.45.78:5174` 접속 확인)
- [ ] 회사 ID 확인 완료
- [ ] 모바일 기기에서 링크 접속 테스트
- [ ] 근로자 등록 페이지 정상 표시 확인

## 💡 팁

- **로컬 테스트**: 컴퓨터에서 `http://localhost:5174` 사용
- **모바일 테스트**: 모바일 기기에서 `http://192.168.45.78:5174` 사용
- **공유**: 링크를 카카오톡이나 이메일로 전송하여 테스트 가능

## 🔧 문제 해결

### "연결할 수 없음" 오류

1. 모바일 앱 서버 실행 확인:
   ```bash
   curl http://192.168.45.78:5174
   ```

2. 컴퓨터 IP 주소 확인:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. Wi-Fi 네트워크 확인:
   - 컴퓨터와 모바일 기기가 같은 네트워크인지 확인

### "타임아웃" 오류

1. 방화벽 설정 확인
2. 포트 5174가 차단되지 않았는지 확인
3. Vite 설정에서 `host: true` 확인

---

**현재 컴퓨터 IP**: `192.168.45.78`  
**모바일 앱 서버**: `http://192.168.45.78:5174`

