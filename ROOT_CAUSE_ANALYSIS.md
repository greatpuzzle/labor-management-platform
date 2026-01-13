# 원인 분석

## 콘솔 로그 분석

콘솔 로그에서:
- `[API Client] Using hostname-based URL: 43.200.44.109`
- `[API Client] Using API Base URL: http://43.200.44.109:3000`

이것은 **이전 버전의 코드**에서 나오는 로그입니다.

## 현재 코드 확인

현재 `packages/shared/api.ts` 코드를 확인해야 합니다. 현재 코드에는:
- `[API Client] AWS deployment detected, using port 3002` 또는
- `[API Client] Production environment detected, using port 3002`

가 있어야 하는데, `Using hostname-based URL`은 **현재 코드에 없습니다**.

## 가능한 원인

1. **배포된 파일이 이전 버전**
   - EC2 서버에 배포된 JavaScript 파일이 이전 버전일 수 있습니다.
   - 파일명: `index-BzTK-1c7.js` (이 파일명이 변경되었는지 확인 필요)

2. **브라우저 캐시**
   - 브라우저가 이전 JavaScript 파일을 캐시하고 있을 수 있습니다.
   - 시크릿 모드에서도 동일한 파일명이면 문제일 수 있습니다.

3. **빌드가 제대로 되지 않음**
   - 로컬에서 빌드는 성공했지만, 실제로 새 코드가 포함되지 않았을 수 있습니다.

## 해결 방법

1. **배포된 파일 확인**
   ```bash
   ./check-deployed-file.sh
   ```

2. **로컬 코드 재확인**
   ```bash
   grep -n "Using hostname-based URL" packages/shared/api.ts
   ```
   만약 이 로그가 현재 코드에 있다면, 코드 수정이 필요합니다.

3. **빌드 및 재배포**
   ```bash
   cd apps/admin
   rm -rf dist node_modules/.vite
   npm run build
   cd ../..
   SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
   EC2_IP="43.200.44.109"
   scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
   ```

4. **브라우저 캐시 완전 삭제**
   - 시크릿 모드 사용 (권장)
   - 또는 브라우저 설정에서 캐시 완전 삭제
