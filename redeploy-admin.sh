#!/bin/bash

# Admin 웹 재배포 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Admin 웹 재배포..."
echo ""

# 1. Admin 웹 빌드
echo "1. Admin 웹 빌드 중..."
cd "$LOCAL_DIR/apps/admin"

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

if [ ! -d "dist" ] || [ -z "$(find dist/assets -name 'index-*.js' 2>/dev/null | head -1)" ]; then
  echo "   ❌ 빌드 실패"
  exit 1
fi

echo "   ✅ 빌드 완료"
echo ""

# 2. 빌드 확인
echo "2. 빌드 확인..."
BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -n "$BUILD_JS" ]; then
  if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
    echo "   ✅ 빌드된 파일에 새 코드 포함됨"
  else
    echo "   ❌ 빌드된 파일에 새 코드 없음"
    exit 1
  fi
  
  if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
    echo "   ❌ 빌드된 파일에 이전 버전 로그 포함됨 (문제!)"
    exit 1
  else
    echo "   ✅ 빌드된 파일에 이전 버전 로그 없음"
  fi
fi

echo ""

# 3. EC2 서버에 배포
echo "3. EC2 서버에 배포 중..."
echo "   업로드: apps/admin/dist/* -> $EC2_HOST:~/app/admin/"

scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일: $DEPLOYED_JS"
    echo "   파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
    echo ""
    
    if grep -q "AWS deployment detected\|Production environment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 배포된 파일에 새 코드 포함됨"
    else
      echo "   ❌ 배포된 파일에 새 코드 없음"
    fi
    
    if grep -q "Using hostname-based URL" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ❌ 배포된 파일에 이전 버전 로그 포함됨"
    else
      echo "   ✅ 배포된 파일에 이전 버전 로그 없음"
    fi
  else
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 재배포 완료!"
echo ""
echo "📋 중요: 브라우저 캐시 완전 삭제 필요!"
echo ""
echo "1. 시크릿 모드 사용 (권장):"
echo "   Chrome: Ctrl+Shift+N (Windows) 또는 Cmd+Shift+N (Mac)"
echo "   주소: http://43.200.44.109:3000"
echo ""
echo "2. 또는 브라우저 캐시 완전 삭제:"
echo "   Chrome: 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제"
echo "   '캐시된 이미지 및 파일' 체크 > 삭제"
echo ""
echo "3. 콘솔 확인:"
echo "   - [API Client] AWS deployment detected, using port 3002"
echo "   - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo ""
