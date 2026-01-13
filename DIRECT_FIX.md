# 직접 수정 가이드

## 문제

여전히 포트 3000을 사용하고 있습니다.

## 확인 방법

배포된 파일을 직접 확인하세요:

```bash
./check-deployed-file.sh
```

이 스크립트는 배포된 JavaScript 파일에서:
1. 43.200.44.109 포함 여부
2. 3002 포트 포함 여부
3. 3000 포트 포함 여부 (문제)
4. AWS deployment detected 포함 여부
5. Using hostname-based URL 포함 여부 (이전 버전)

## 해결 방법

### 1. 배포된 파일 확인

```bash
./check-deployed-file.sh
```

### 2. 만약 배포된 파일에 문제가 있다면

로컬에서 다시 빌드하고 배포:

```bash
cd apps/admin
rm -rf dist node_modules/.vite
npm run build
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

### 3. 브라우저 캐시 완전 삭제

**시크릿 모드 사용 (가장 확실한 방법):**
- Chrome: `Ctrl+Shift+N` (Windows) 또는 `Cmd+Shift+N` (Mac)
- 주소: http://43.200.44.109:3000

### 4. 확인

콘솔에서:
- ✅ `[API Client] AWS deployment detected, using port 3002`
- ✅ `[API Client] Using API Base URL: http://43.200.44.109:3002`
