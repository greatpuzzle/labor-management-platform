# 배포 문제 원인 분석

## 가능한 원인

프론트엔드 배포가 제대로 안 되는 이유:

### 1. 파일명 변경 문제 (가장 가능성 높음) ⭐

Vite는 빌드할 때 파일명에 해시를 포함합니다:
- 이전 빌드: `index-BzTK-1c7.js`
- 새로운 빌드: `index-DR49-q9s.js` (다를 수 있음)

**문제:**
- 새로운 빌드를 하면 JavaScript 파일명이 변경됩니다
- `index.html` 파일도 함께 업데이트되어야 합니다
- 하지만 `scp -r apps/admin/dist/*`로 배포하면:
  - 기존 파일이 완전히 삭제되지 않을 수 있습니다
  - HTML 파일과 JavaScript 파일이 일치하지 않을 수 있습니다

### 2. HTML 파일이 업데이트되지 않음

`index.html` 파일도 함께 배포되어야 하는데:
- HTML 파일이 업데이트되지 않으면 이전 JavaScript 파일을 참조할 수 있습니다
- 또는 배포 경로 문제로 HTML과 JavaScript 파일이 일치하지 않을 수 있습니다

### 3. 배포 경로 문제

`scp -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/`는:
- `dist/*`의 내용을 `~/app/admin/`에 복사합니다
- 하지만 기존 파일이 완전히 삭제되지 않을 수 있습니다
- 특히 `dist/assets/` 폴더 안에 이전 파일이 남아있을 수 있습니다

### 4. 브라우저 캐시

브라우저가 이전 JavaScript 파일을 캐시하고 있을 수 있습니다:
- 시크릿 모드에서도 문제가 있다면 서버 문제입니다
- 시크릿 모드에서 정상이면 브라우저 캐시 문제입니다

### 5. 서빙 프로세스 문제

포트 3000에서 Admin 웹을 서빙하는 프로세스(예: `admin-page`)가:
- 이전 파일을 캐시하고 있을 수 있습니다
- 또는 다른 경로의 파일을 서빙하고 있을 수 있습니다

## 확인 방법

```bash
./analyze-deployment-issue.sh
```

이 스크립트는:
1. 로컬 빌드 확인
2. 배포된 파일 확인
3. 파일명 비교 (가장 중요!)
4. 파일 크기 비교
5. 배포된 파일 내용 확인
6. 모든 JavaScript 파일 확인 (이전 파일 남아있는지)
7. HTML 파일 확인 (참조하는 JavaScript 파일명)
8. 포트 3000 사용 프로세스 확인

## 해결 방법

### 1. 기존 파일 완전 삭제 후 배포 (권장)

```bash
./fix-deployment-complete.sh
```

이 스크립트는:
- 기존 파일을 완전히 삭제한 후 배포합니다
- 파일명 비교를 확인합니다
- HTML 파일도 함께 확인합니다

### 2. 수동으로 완전 삭제 후 배포

```bash
# 1. 로컬 빌드
cd apps/admin
rm -rf dist node_modules/.vite
npm run build

# 2. EC2 서버에 기존 파일 완전 삭제
ssh -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109 "rm -rf /home/ubuntu/app/admin/*"

# 3. 새 파일 업로드
cd ../..
scp -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem -r apps/admin/dist/* ubuntu@43.200.44.109:~/app/admin/

# 4. 배포 확인
ssh -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109 << 'EOF'
  echo "배포된 파일:"
  ls -lh /home/ubuntu/app/admin/assets/index-*.js | head -3
  
  echo ""
  echo "HTML 파일이 참조하는 JavaScript:"
  grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html | head -3
EOF
```

## 가장 가능성 높은 원인

**파일명 변경 문제**가 가장 가능성이 높습니다:
1. Vite는 빌드할 때마다 파일명에 해시를 포함합니다
2. 새로운 빌드를 하면 JavaScript 파일명이 변경됩니다
3. HTML 파일도 함께 업데이트되어야 합니다
4. 하지만 기존 파일이 완전히 삭제되지 않으면 이전 파일도 남아있을 수 있습니다

## 확인 순서

1. 배포 분석: `./analyze-deployment-issue.sh`
2. 문제 확인: 파일명 불일치, 이전 파일 존재 등
3. 완전한 재배포: `./fix-deployment-complete.sh`
4. 브라우저 캐시 삭제: 시크릿 모드 사용
