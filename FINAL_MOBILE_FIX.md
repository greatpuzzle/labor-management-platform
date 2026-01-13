# 모바일 앱 API URL 문제 최종 해결 가이드

## 문제 원인
Service Worker가 이전 버전의 `index.html`을 캐시에서 로드하고 있어서, 새로운 코드가 반영되지 않습니다.

## 해결 방법

### 1단계: 로컬 빌드
```bash
cd apps/mobile
rm -rf dist node_modules/.vite
npm run build
```

### 2단계: 강제 재배포
```bash
cd ../..
./force-redeploy-mobile-v2.sh
```

### 3단계: 브라우저에서 Service Worker 완전 제거

**중요: 이 단계를 반드시 수행하세요!**

1. Chrome 개발자 도구 열기 (F12)
2. **Application** 탭 클릭
3. 왼쪽 사이드바에서 **Service Workers** 클릭
4. 등록된 모든 Service Worker에 대해:
   - **Unregister** 버튼 클릭
   - 또는 **Update** 버튼 클릭 후 **Unregister** 클릭
5. 왼쪽 사이드바에서 **Cache Storage** 클릭
6. 모든 캐시 항목을 하나씩 선택하고 **Delete** 클릭
7. 왼쪽 사이드바에서 **Storage** 클릭
8. **Clear site data** 버튼 클릭
9. **모든 체크박스 선택** 후 **Clear site data** 클릭

### 4단계: 브라우저 완전히 닫기
- 모든 Chrome 창 닫기
- 작업 관리자에서 Chrome 프로세스가 완전히 종료되었는지 확인

### 5단계: 시크릿 모드로 접속
1. Chrome 시크릿 모드(인코그니토)로 열기
2. `http://43.200.44.109:3001/invite.html?invite=...` 접속
3. 하드 리프레시: `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`)

### 6단계: 콘솔 확인
개발자 도구 → Console 탭에서 다음 메시지 확인:
- ✅ `[HTML] Unregistering Service Worker: ...`
- ✅ `[HTML] Backend API URL set to: http://43.200.44.109:3002`
- ❌ `http://192.168.45.219:3000` 메시지가 나오면 안 됩니다!

## 변경 사항

1. **Service Worker 캐시 버전 변경**: `CACHE_NAME`을 타임스탬프 기반으로 변경
2. **Service Worker 자동 제거**: `index.html`에 Service Worker 제거 코드 추가
3. **캐시 자동 삭제**: 모든 캐시를 자동으로 삭제하는 코드 추가
4. **API URL 설정 강화**: AWS 환경 체크를 최우선으로 변경

## 여전히 문제가 있으면?

1. 다른 브라우저로 시도 (Firefox, Safari 등)
2. 브라우저 데이터 완전 삭제:
   - Chrome 설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제
   - "전체 기간" 선택
   - "캐시된 이미지 및 파일" 체크
   - "삭제" 클릭
3. 서버 파일 직접 확인:
   ```bash
   ssh -i ~/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109
   cat /home/ubuntu/app/mobile/index.html | grep -A 10 "43.200.44.109"
   ```
