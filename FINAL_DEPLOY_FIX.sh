#!/bin/bash

# 최종 배포 수정 스크립트 - 완전한 재배포

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 최종 배포 수정 - 완전한 재배포..."
echo ""

# 1. 로컬 빌드
echo "1. 로컬 빌드..."
cd "$LOCAL_DIR/apps/admin"

# 기존 파일 완전 삭제
if [ -d "dist" ]; then
  echo "   기존 dist 폴더 삭제 중..."
  rm -rf dist
fi

if [ -d "node_modules/.vite" ]; then
  echo "   Vite 캐시 삭제 중..."
  rm -rf node_modules/.vite
fi

echo "   빌드 중..."
npm run build 2>&1 | tail -20

if [ ! -d "dist" ] || [ -z "$(find dist/assets -name 'index-*.js' 2>/dev/null | head -1)" ]; then
  echo "   ❌ 빌드 실패!"
  echo ""
  echo "   .env 파일 권한 문제일 수 있습니다."
  echo "   apps/admin/.env 파일을 확인하거나 임시로 이름을 변경해 보세요."
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
BUILD_JS_NAME=$(basename "$BUILD_JS")
echo "   ✅ 빌드 완료: $BUILD_JS_NAME"
echo ""

# 2. 빌드 확인
echo "2. 빌드 확인..."
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드에 이전 버전 코드 포함됨!"
  exit 1
fi

if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드에 새 코드 포함됨"
else
  echo "   ❌ 빌드에 새 코드 없음!"
  exit 1
fi

echo "   ✅ 빌드 정상"
echo ""

# 3. EC2 서버의 기존 파일 완전 삭제
echo "3. EC2 서버의 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -d "/home/ubuntu/app/admin" ]; then
    echo "   백업 생성 중..."
    BACKUP_DIR="/home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r /home/ubuntu/app/admin/* "$BACKUP_DIR/" 2>/dev/null || true
    
    echo "   기존 파일 삭제 중..."
    rm -rf /home/ubuntu/app/admin/*
    rm -rf /home/ubuntu/app/admin/.[^.]* 2>/dev/null || true
    
    echo "   ✅ 기존 파일 완전 삭제 완료"
    echo "   백업 위치: $BACKUP_DIR"
  else
    mkdir -p /home/ubuntu/app/admin
    echo "   ✅ 디렉토리 생성 완료"
  fi
EOF

echo ""

# 4. 새 파일 업로드
echo "4. 새 파일 업로드..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -10

echo "   ✅ 파일 업로드 완료"
echo ""

# 5. 배포 확인
echo "5. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  DEPLOYED_JS=\$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  
  if [ -z "\$DEPLOYED_JS" ]; then
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
    exit 1
  fi
  
  DEPLOYED_JS_NAME=\$(basename "\$DEPLOYED_JS")
  echo "   배포된 파일: \$DEPLOYED_JS_NAME"
  echo "   파일 크기: \$(ls -lh "\$DEPLOYED_JS" | awk '{print \$5}')"
  echo "   수정 시간: \$(ls -l "\$DEPLOYED_JS" | awk '{print \$6, \$7, \$8}')"
  echo ""
  
  # 파일명 비교
  if [ "\$DEPLOYED_JS_NAME" != "$BUILD_JS_NAME" ]; then
    echo "   ⚠️  파일명이 다릅니다!"
    echo "   로컬: $BUILD_JS_NAME"
    echo "   배포: \$DEPLOYED_JS_NAME"
  else
    echo "   ✅ 파일명 일치"
  fi
  
  echo ""
  echo "   코드 확인:"
  if grep -q "Using hostname-based URL" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ❌ 이전 버전 로그 포함됨!"
  else
    echo "   ✅ 이전 버전 로그 없음"
  fi
  
  if grep -q "AWS deployment detected\|Production environment detected" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 새 코드 포함됨"
  else
    echo "   ❌ 새 코드 없음!"
  fi
  
  echo ""
  echo "   HTML 파일 확인:"
  HTML_REF=\$(grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html 2>/dev/null | head -1)
  if [ "\$HTML_REF" = "\$DEPLOYED_JS_NAME" ]; then
    echo "   ✅ HTML 파일이 올바른 JavaScript 파일을 참조함"
  else
    echo "   ⚠️  HTML 파일 참조: \$HTML_REF"
    echo "   실제 파일: \$DEPLOYED_JS_NAME"
  fi
EOF

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 중요: 브라우저 캐시 완전 삭제 필요!"
echo ""
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드에서 접속:"
echo "   - Mac: Cmd + Shift + N"
echo "   - Windows: Ctrl + Shift + N"
echo "   - 주소: http://43.200.44.109:3000"
echo ""
echo "3. 콘솔(F12)에서 확인:"
echo "   ✅ [API Client] AWS deployment detected, using port 3002"
echo "   ✅ [API Client] Using API Base URL: http://43.200.44.109:3002"
echo "   ❌ [API Client] Using hostname-based URL (이 메시지가 나오면 안 됨)"
echo ""
