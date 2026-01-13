# 원인 분석 요약

## 콘솔 로그 분석 결과

### 현재 콘솔 로그:
- `[API Client] Using hostname-based URL: 43.200.44.109`
- `[API Client] Using API Base URL: http://43.200.44.109:3000`

### 현재 코드 상태:
- 코드에는 `Using hostname-based URL` 로그가 **없습니다**
- 코드에는 `AWS deployment detected, using port 3002` 또는 `Production environment detected, using port 3002` 로그가 **있습니다**

## 원인

**배포된 파일이 이전 버전입니다.**

1. 로컬 코드는 올바르게 수정되어 있음
2. 빌드도 올바르게 되었을 가능성 (사용자 확인 완료)
3. 하지만 **EC2 서버에 배포된 파일은 이전 버전**

## 해결 방법

### 1. 배포된 파일 확인

```bash
./check-deployed-file.sh
```

이 스크립트는 EC2 서버의 배포된 파일에서:
- `Using hostname-based URL` 포함 여부 확인
- `AWS deployment detected` 포함 여부 확인
- 파일 수정 시간 확인

### 2. 재배포

배포가 제대로 되지 않았을 수 있으므로 재배포:

```bash
cd apps/admin
rm -rf dist node_modules/.vite
npm run build
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

### 3. 배포 확인

```bash
./check-deployed-file.sh
```

### 4. 브라우저 캐시 완전 삭제

- 시크릿 모드 사용 (권장)
- 또는 브라우저 설정에서 캐시 완전 삭제
