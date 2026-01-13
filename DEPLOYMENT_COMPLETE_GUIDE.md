# 전체 배포 가이드 (백엔드 + 프론트엔드)

## 현재 상황

Admin 웹과 앱만 재배포하고 있었습니다. 백엔드도 확인이 필요합니다.

## 배포 구성

1. **백엔드**: 포트 3002 (NestJS)
2. **Admin 웹**: 포트 3000 (정적 파일)
3. **Mobile 앱**: 포트 3001 (정적 파일)

## 확인 방법

### 1. 백엔드 상태 확인

```bash
./check-backend.sh
```

이 스크립트는:
- PM2 프로세스 상태 확인
- 백엔드 로그 확인
- 헬스 체크 (포트 3002)
- 포트 사용 현황 확인
- 백엔드 디렉토리 확인
- .env 파일 확인
- ecosystem.config.js 확인

### 2. Admin 웹 재배포

```bash
./redeploy-admin.sh
```

## 백엔드 재배포가 필요한 경우

백엔드도 재배포가 필요한 경우, 백엔드 배포 스크립트를 확인해야 합니다.

백엔드 재배포 명령어:

```bash
# 1. 백엔드 빌드
cd apps/backend
npm run build

# 2. EC2 서버에 배포
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"

# 백엔드 파일 업로드
scp -i "$SSH_KEY_PATH" -r apps/backend/dist/* ubuntu@$EC2_IP:~/app/backend/dist/
scp -i "$SSH_KEY_PATH" apps/backend/.env ubuntu@$EC2_IP:~/app/backend/.env
scp -i "$SSH_KEY_PATH" apps/backend/ecosystem.config.js ubuntu@$EC2_IP:~/app/backend/ecosystem.config.js
scp -i "$SSH_KEY_PATH" apps/backend/package.json ubuntu@$EC2_IP:~/app/backend/package.json
scp -i "$SSH_KEY_PATH" -r apps/backend/prisma ubuntu@$EC2_IP:~/app/backend/prisma

# 3. EC2 서버에서 백엔드 재시작
ssh -i "$SSH_KEY_PATH" ubuntu@$EC2_IP << 'EOF'
  cd /home/ubuntu/app/backend
  npm install --production --no-audit --no-fund
  npx prisma generate
  pm2 restart backend-api || pm2 start ecosystem.config.js --env production
  pm2 save
EOF
```

## 확인 순서

1. 백엔드 상태 확인: `./check-backend.sh`
2. 백엔드가 정상이면: Admin 웹만 재배포: `./redeploy-admin.sh`
3. 백엔드가 비정상이면: 백엔드도 재배포
