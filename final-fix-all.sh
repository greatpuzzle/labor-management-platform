#!/bin/bash

# 최종 수정 스크립트 - 완전한 재배포 + PM2 재시작

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 최종 수정: 완전한 재배포 + PM2 재시작 ==="
echo ""

# 1. 로컬 빌드
echo "1. 로컬 빌드 (기존 파일 완전 삭제)..."
cd "$LOCAL_DIR/apps/admin"

if [ -d "dist" ]; then
  echo "   기존 dist 폴더 삭제..."
  rm -rf dist
fi

if [ -d "node_modules/.vite" ]; then
  echo "   Vite 캐시 삭제..."
  rm -rf node_modules/.vite
fi

echo "   빌드 중..."
npm run build 2>&1 | tail -20

if [ ! -d "dist" ] || [ -z "$(find dist/assets -name 'index-*.js' 2>/dev/null | head -1)" ]; then
  echo "   ❌ 빌드 실패!"
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
BUILD_JS_NAME=$(basename "$BUILD_JS")
echo "   ✅ 빌드 완료: $BUILD_JS_NAME"
echo ""

# 빌드 확인
echo "   빌드 파일 내용 확인:"
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드에 이전 로그 포함됨!"
  exit 1
else
  echo "   ✅ 빌드에 이전 로그 없음"
fi

if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드에 새 코드 포함됨"
else
  echo "   ❌ 빌드에 새 코드 없음!"
  exit 1
fi

echo ""

# 2. 서버의 모든 파일 완전 삭제
echo "2. 서버의 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  ADMIN_DIR="/home/ubuntu/app/admin"
  
  if [ -d "$ADMIN_DIR" ]; then
    echo "   백업 생성 중..."
    BACKUP_DIR="/home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$ADMIN_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    
    echo "   모든 파일 완전 삭제 중..."
    rm -rf "$ADMIN_DIR"/*
    rm -rf "$ADMIN_DIR"/.[^.]* 2>/dev/null || true
    
    # assets 디렉토리도 완전 삭제
    rm -rf "$ADMIN_DIR"/assets 2>/dev/null || true
    
    echo "   ✅ 파일 삭제 완료"
    echo "   백업 위치: $BACKUP_DIR"
  else
    mkdir -p "$ADMIN_DIR"
    echo "   ✅ 디렉토리 생성 완료"
  fi
EOF

echo ""

# 3. 새 파일 업로드
echo "3. 새 파일 업로드..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -10

echo "   ✅ 파일 업로드 완료"
echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  DEPLOYED_JS=\$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  
  if [ -z "\$DEPLOYED_JS" ]; then
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
    exit 1
  fi
  
  DEPLOYED_JS_NAME=\$(basename "\$DEPLOYED_JS")
  echo "   배포된 파일: \$DEPLOYED_JS_NAME"
  echo ""
  
  echo "   코드 확인:"
  if grep -q "Using hostname-based URL" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ❌ 이전 로그 포함됨!"
    echo "   위치: \$(grep -n 'Using hostname-based URL' "\$DEPLOYED_JS" | head -1 | cut -d: -f1)"
  else
    echo "   ✅ 이전 로그 없음"
  fi
  
  if grep -q "AWS deployment detected\|Production environment detected" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 새 코드 포함됨"
  else
    echo "   ❌ 새 코드 없음!"
  fi
  
  echo ""
  echo "   HTML 파일 확인:"
  HTML_REF=\$(grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html 2>/dev/null | head -1)
  echo "   HTML 참조: \$HTML_REF"
  echo "   실제 파일: \$DEPLOYED_JS_NAME"
  
  if [ "\$HTML_REF" = "\$DEPLOYED_JS_NAME" ]; then
    echo "   ✅ HTML 파일이 올바른 JavaScript 파일을 참조함"
  else
    echo "   ⚠️  HTML 파일 참조가 다릅니다!"
  fi
  
  echo ""
  echo "   서버의 모든 JavaScript 파일:"
  ls -lah /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null || echo "   파일 없음"
EOF

echo ""
echo ""

# 5. PM2 재시작
echo "5. PM2 프로세스 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    echo "   admin-page 프로세스 재시작 중..."
    pm2 restart admin-page
    sleep 2
    echo "   ✅ admin-page 재시작 완료"
  else
    echo "   ⚠️ admin-page 프로세스를 찾을 수 없습니다"
  fi
  
  echo ""
  echo "   PM2 상태:"
  pm2 list | grep -E "admin-page|backend-api" || echo "   프로세스를 찾을 수 없습니다"
EOF

echo ""
echo ""

echo "✅ 모든 작업 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드에서 접속 (캐시 없음):"
echo "   - Mac: Cmd + Shift + N"
echo "   - Windows: Ctrl + Shift + N"
echo "   - 주소: http://43.200.44.109:3000"
echo ""
echo "3. Network 탭에서 확인:"
echo "   - ✅ 새 파일명 (예: index-DR49-q9s.js)이 로드되어야 함"
echo "   - ❌ index-BzTK-1c7.js가 로드되면 안 됨"
echo ""
echo "4. 콘솔(F12)에서 확인:"
echo "   - ✅ [API Client] AWS deployment detected, using port 3002"
echo "   - ✅ [API Client] Using API Base URL: http://43.200.44.109:3002"
echo "   - ❌ [API Client] Using hostname-based URL (이 메시지가 나오면 안 됨)"
echo ""
