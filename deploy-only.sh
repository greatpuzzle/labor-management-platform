#!/bin/bash

# 배포만 수행하는 스크립트 (빌드는 이미 완료된 경우)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Admin 웹 배포만 수행..."
echo ""

# 1. 빌드 확인
echo "1. 빌드 확인..."
if [ ! -d "$LOCAL_DIR/apps/admin/dist" ]; then
  echo "   ❌ dist 폴더가 없습니다. 먼저 빌드를 실행하세요:"
  echo "      cd apps/admin && npm run build"
  exit 1
fi

BUILD_JS=$(find "$LOCAL_DIR/apps/admin/dist/assets" -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$BUILD_JS" ]; then
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다."
  exit 1
fi

echo "   ✅ 빌드된 파일 확인: $BUILD_JS"
echo ""

# 2. EC2 서버에 배포
echo "2. EC2 서버에 배포 중..."
echo "   업로드: apps/admin/dist/* -> $EC2_HOST:~/app/admin/"

scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 3. 배포 확인
echo "3. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일: $DEPLOYED_JS"
    echo "   파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
  else
    echo "   ⚠️  배포된 JavaScript 파일을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 접속: http://43.200.44.109:3000"
echo "2. 시크릿 모드 사용 또는 브라우저 캐시 삭제"
echo "3. Excel 다운로드 버튼이 제거되었는지 확인"
echo "4. 초대 링크가 올바르게 생성되는지 확인"
echo ""