#!/bin/bash

# Mobile 앱 재배포 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Mobile 앱 재배포..."
echo ""

# 1. Mobile 앱 빌드
echo "1. Mobile 앱 빌드 중..."
cd "$LOCAL_DIR/apps/mobile"

# 기존 파일 삭제
if [ -d "dist" ]; then
  echo "   기존 dist 폴더 삭제 중..."
  rm -rf dist
fi

if [ -d "node_modules/.vite" ]; then
  echo "   Vite 캐시 삭제 중..."
  rm -rf node_modules/.vite
fi

echo "   빌드 중..."
npm run build 2>&1 | tail -10

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  echo "   ❌ 빌드 실패"
  exit 1
fi

echo "   ✅ 빌드 완료"
echo ""

# 2. EC2 서버에 배포 (PM2가 서빙하는 실제 경로로 배포)
DEPLOY_PATH="~/labor-management-platform/apps/mobile/dist"
echo "2. EC2 서버에 배포 중..."
echo "   업로드: apps/mobile/dist/* -> $EC2_HOST:$DEPLOY_PATH/"

# 서버의 기존 assets 폴더 삭제 후 새 파일 업로드
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "rm -rf $DEPLOY_PATH/assets"
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/mobile/dist/"* "$EC2_HOST:$DEPLOY_PATH/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 3. PM2 재시작 및 배포 확인
echo "3. PM2 재시작 및 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOY_PATH="/home/ubuntu/labor-management-platform/apps/mobile/dist"

  if [ -f "$DEPLOY_PATH/index.html" ]; then
    echo "   배포된 index.html 확인됨"
    echo "   파일 크기: $(ls -lh $DEPLOY_PATH/index.html | awk '{print $5}')"
    echo "   수정 시간: $(ls -l $DEPLOY_PATH/index.html | awk '{print $6, $7, $8}')"

    # API URL 확인
    if grep -q "43.200.44.109.*3002\|hostname.*3002" $DEPLOY_PATH/index.html 2>/dev/null; then
      echo "   ✅ API URL이 포트 3002로 설정됨"
    else
      echo "   ⚠️  API URL 설정 확인 필요"
    fi

    # PM2 재시작
    echo "   PM2 mobile-page 재시작 중..."
    pm2 restart mobile-page --silent
    echo "   ✅ PM2 재시작 완료"
  else
    echo "   ❌ 배포된 index.html을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 재배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 접속: http://43.200.44.109:3001"
echo "2. 초대 링크로 접속 테스트"
echo "3. 브라우저 캐시 삭제 또는 시크릿 모드 사용"
echo "4. 콘솔에서 API URL 확인: http://43.200.44.109:3002"
echo ""