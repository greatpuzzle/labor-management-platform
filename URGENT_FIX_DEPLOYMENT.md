# 긴급 배포 수정 가이드

## 현재 문제

여전히 이전 버전 코드가 실행되고 있습니다:
- 파일명: `index-BzTK-1c7.js` (이전 버전)
- 로그: `[API Client] Using hostname-based URL` (이전 버전 로그)
- 포트: `3000` (잘못된 포트)

## 해결 방법

### 1. 먼저 서버 파일 확인

```bash
chmod +x check-server-files.sh
./check-server-files.sh
```

이 스크립트는 서버에 올라간 파일이 실제로 새 코드인지 이전 코드인지 확인합니다.

### 2. 완전한 재배포

```bash
chmod +x FINAL_DEPLOY_FIX.sh
./FINAL_DEPLOY_FIX.sh
```

이 스크립트는:
1. 로컬 빌드 (기존 파일 완전 삭제)
2. 빌드 확인 (새 코드 포함 여부)
3. EC2 서버의 기존 파일 완전 삭제
4. 새 파일 업로드
5. 배포 확인 (파일명, 코드 내용)

### 3. 브라우저 캐시 완전 삭제 (필수!)

배포 후 반드시:

1. **브라우저 완전히 닫기**
2. **시크릿 모드에서 접속**:
   - Mac: `Cmd + Shift + N`
   - Windows: `Ctrl + Shift + N`
   - 주소: `http://43.200.44.109:3000`
3. **콘솔(F12) 확인**:
   - ✅ `[API Client] AWS deployment detected, using port 3002`
   - ✅ `[API Client] Using API Base URL: http://43.200.44.109:3002`
   - ❌ `[API Client] Using hostname-based URL` (이 메시지가 나오면 안 됨)

## 확인 순서

1. 서버 파일 확인: `./check-server-files.sh`
2. 완전한 재배포: `./FINAL_DEPLOY_FIX.sh`
3. 브라우저 캐시 삭제 후 확인
