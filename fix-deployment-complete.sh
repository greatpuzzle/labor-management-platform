#!/bin/bash

# 완전한 배포 수정 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 완전한 배포 수정..."
echo ""

# 1. 로컬 빌드
echo "1. 로컬 빌드..."
cd "$LOCAL_DIR/apps/admin"

if [ -d "dist" ]; then
  rm -rf dist
fi

if [ -d "node_modules/.vite" ]; then
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
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드에 문제가 있습니다"
  exit 1
fi

if ! grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드에 새 코드가 없습니다"
  exit 1
fi

echo "   ✅ 빌드 정상"
echo ""

# 3. EC2 서버에 기존 파일 완전 삭제 후 배포
echo "3. EC2 서버에 배포 (기존 파일 완전 삭제 후 배포)..."
echo "   기존 파일 삭제 중..."

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  # 기존 파일 백업
  if [ -d "/home/ubuntu/app/admin" ]; then
    mkdir -p /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)
    cp -r /home/ubuntu/app/admin/* /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)/ 2>/dev/null || true
    echo "   기존 파일 백업 완료"
    
    # 기존 파일 완전 삭제
    rm -rf /home/ubuntu/app/admin/*
    echo "   기존 파일 삭제 완료"
  fi
EOF

echo ""
echo "   새 파일 업로드 중..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   배포된 파일 목록:"
  ls -lh /home/ubuntu/app/admin/ 2>/dev/null | head -10
  
  echo ""
  echo "   JavaScript 파일 목록:"
  ls -lh /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -5 || echo "   파일 없음"
  
  echo ""
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일 확인:"
    echo "   파일: $(basename $DEPLOYED_JS)"
    echo "   크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    
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
  
  echo ""
  echo "   HTML 파일 확인:"
  if [ -f "/home/ubuntu/app/admin/index.html" ]; then
    echo "   ✅ index.html 존재"
    echo "   참조하는 JavaScript 파일:"
    grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html | head -3
  else
    echo "   ❌ index.html 없음"
  fi
EOF

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. 시크릿 모드에서 접속: http://43.200.44.109:3000"
echo "   2. 콘솔 확인:"
echo "      - [API Client] AWS deployment detected, using port 3002"
echo "      - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo ""
