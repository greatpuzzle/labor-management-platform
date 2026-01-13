# 빌드 문제 분석

## 문제 상황

재배포를 여러 번 시도했지만 여전히 포트 3000을 사용하고 있습니다.

## 가능한 원인

1. **빌드가 제대로 되지 않음**
   - `packages/shared/api.ts`가 빌드에 포함되지 않았을 수 있음
   - Vite 캐시 문제

2. **배포가 제대로 되지 않음**
   - 파일 업로드 실패
   - 잘못된 경로에 배포

3. **브라우저 캐시**
   - 이전 JavaScript 파일을 캐시하고 있음

## 확인 방법

다음 스크립트를 실행하여 빌드된 파일을 확인하세요:

```bash
./check-build-content.sh
```

이 스크립트는:
1. 로컬 코드 확인 (43.200.44.109 체크 포함 여부)
2. 빌드된 파일 확인 (43.200.44.109 포함 여부)
3. 새 로그 메시지 확인 (AWS deployment detected)
4. 이전 버전 로그 확인 (Using hostname-based URL)

## 해결 방법

### 1. 빌드 확인

```bash
cd apps/admin
rm -rf dist node_modules/.vite
npm run build
cd ../..
./check-build-content.sh
```

### 2. 빌드가 올바르면 배포

```bash
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

### 3. 브라우저 캐시 완전 삭제

- 시크릿 모드 사용 (권장)
- 또는 브라우저 설정에서 캐시 완전 삭제
