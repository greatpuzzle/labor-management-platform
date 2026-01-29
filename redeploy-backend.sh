#!/bin/bash

# 백엔드 재배포 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 백엔드 재배포 시작 ==="
echo ""

# 1. 로컬 빌드
echo "1. 백엔드 빌드..."
cd "$LOCAL_DIR/apps/backend"

if [ -d "dist" ]; then
  echo "   기존 dist 폴더 삭제..."
  rm -rf dist
fi

echo "   빌드 중..."
npm run build 2>&1 | tail -20

if [ ! -d "dist" ]; then
  echo "   ❌ 빌드 실패!"
  exit 1
fi

echo "   ✅ 빌드 완료"
echo ""

# 2. 서버에 파일 업로드
echo "2. 서버에 파일 업로드..."
echo "   dist 파일 업로드 중..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/backend/dist/"* "$EC2_HOST:~/app/backend/dist/" 2>&1 | tail -10

echo "   ✅ 파일 업로드 완료"
echo ""

# 3. Prisma 스키마 및 마이그레이션 파일 업로드
echo "3. Prisma 스키마 및 마이그레이션 파일 업로드..."
scp -i "$SSH_KEY_PATH" "$LOCAL_DIR/apps/backend/prisma/schema.prisma" "$EC2_HOST:~/app/backend/prisma/" 2>&1 | tail -5
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/backend/prisma/migrations/"* "$EC2_HOST:~/app/backend/prisma/migrations/" 2>&1 | tail -5

echo "   ✅ 파일 업로드 완료"
echo ""

# 4. 서버에서 마이그레이션 실행 및 백엔드 재시작
echo "4. 서버에서 마이그레이션 실행 및 백엔드 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   Prisma generate 중..."
  npx prisma generate 2>&1 | tail -5
  
  echo "   Prisma 마이그레이션 실행 중..."
  npx prisma migrate deploy 2>&1 | tail -10
  
  echo "   PM2 재시작 중..."
  pm2 restart backend-api 2>&1 || pm2 start ecosystem.config.js --env production 2>&1
  
  sleep 2
  
  echo "   ✅ 백엔드 재시작 완료"
  echo ""
  echo "   PM2 상태:"
  pm2 list | grep backend-api || echo "   backend-api 프로세스를 찾을 수 없습니다"
EOF

echo ""
echo ""

echo "✅ 백엔드 재배포 완료!"
echo ""
echo "📋 확인:"
echo "1. 브라우저에서 다시 로그인 시도"
echo "2. 콘솔에서 CORS 에러가 사라졌는지 확인"
echo ""
