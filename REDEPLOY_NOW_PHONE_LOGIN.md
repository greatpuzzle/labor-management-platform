# 핸드폰 인증 화면 재배포 가이드

## 문제
서버에 배포된 파일이 최신 코드가 아닙니다. 핸드폰 인증 화면이 표시되지 않습니다.

## 해결 방법

### 1단계: 최신 코드로 빌드

```bash
cd apps/mobile
npm run build
```

### 2단계: 빌드 확인

빌드된 파일에 PhoneLogin이 포함되어 있는지 확인:

```bash
grep -r "PhoneLogin\|핸드폰 인증" apps/mobile/dist/assets/*.js | head -3
```

### 3단계: 서버에 재배포

```bash
cd ../..
./force-redeploy-mobile-v2.sh
```

### 4단계: 브라우저 캐시 완전 삭제

1. 개발자 도구 열기 (F12)
2. Application 탭 클릭
3. 왼쪽에서 "Storage" 선택
4. "Clear site data" 클릭
5. 또는 시크릿 모드로 접속

### 5단계: 확인

http://43.200.44.109:3001 접속 후:
- 핸드폰 인증 화면이 표시되어야 합니다
- 콘솔에 `[App]` 로그 확인

## 빠른 해결

터미널에서 한 번에 실행:

```bash
cd apps/mobile && npm run build && cd ../.. && ./force-redeploy-mobile-v2.sh
```
