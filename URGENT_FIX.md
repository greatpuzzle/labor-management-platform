# 긴급 수정 가이드

## 문제

여전히 포트 3000을 사용하고 있습니다. 콘솔 로그:
- `[API Client] Using hostname-based URL: 43.200.44.109`
- `[API Client] Using API Base URL: http://43.200.44.109:3000`

## 해결 방법

코드가 제대로 빌드되지 않았거나 배포되지 않았을 수 있습니다.

### 1. 코드 확인 및 수정

현재 코드를 확인하고, 43.200.44.109에 대한 체크가 제대로 있는지 확인해야 합니다.

### 2. 즉시 재배포

```bash
cd apps/admin
rm -rf dist node_modules/.vite
npm run build
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

### 3. 브라우저 완전 초기화

1. 브라우저 완전히 닫기
2. 시크릿 모드에서 테스트
3. 또는 브라우저 캐시 완전 삭제
