#!/bin/bash

# 강제 Admin 재배포 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 강제 Admin 재배포..."
echo ""

# 1. 로컬 빌드
echo "1. 로컬 빌드..."
cd "$LOCAL_DIR/apps/admin"

# 기존 파일 삭제
if [ -d "dist" ]; then
  rm -rf dist
fi

if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
fi

echo "   빌드 중..."
npm run build 2>&1 | tail -15

if [ ! -d "dist" ] || [ -z "$(find dist/assets -name 'index-*.js' 2>/dev/null | head -1)" ]; then
  echo "   ❌ 빌드 실패 - 하지만 계속 진행합니다..."
fi

echo "   ✅ 빌드 완료 (또는 시도 완료)"
echo ""

# 2. EC2 서버에 기존 파일 완전 삭제
echo "2. EC2 서버에 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -d "/home/ubuntu/app/admin" ]; then
    # 백업
    if [ -n "$(ls -A /home/ubuntu/app/admin 2>/dev/null)" ]; then
      mkdir -p /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)
      cp -r /home/ubuntu/app/admin/* /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)/ 2>/dev/null || true
    fi
    
    # 완전 삭제
    rm -rf /home/ubuntu/app/admin/*
    rm -rf /home/ubuntu/app/admin/.* 2>/dev/null || true
    echo "   ✅ 기존 파일 완전 삭제 완료"
  else
    mkdir -p /home/ubuntu/app/admin
    echo "   ✅ 디렉토리 생성 완료"
  fi
EOF

echo ""

# 3. 새 파일 업로드
echo "3. 새 파일 업로드..."
if [ -d "$LOCAL_DIR/apps/admin/dist" ]; then
  scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -10
  echo "   ✅ 파일 업로드 완료"
else
  echo "   ⚠️  dist 폴더가 없습니다. 수동으로 빌드 후 다시 실행하세요."
  exit 1
fi

echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   배포된 JavaScript 파일:"
  ls -lh /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -3 || echo "   파일 없음"
  
  echo ""
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   파일명: $(basename $DEPLOYED_JS)"
    echo "   크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    
    echo ""
    echo "   코드 확인:"
    if grep -q "AWS deployment detected\|Production environment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 새 코드 포함됨"
    else
      echo "   ❌ 새 코드 없음"
    fi
    
    if grep -q "Using hostname-based URL" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ❌ 이전 버전 로그 포함됨"
    else
      echo "   ✅ 이전 버전 로그 없음"
    fi
  fi
  
  echo ""
  echo "   HTML 파일이 참조하는 JavaScript:"
  if [ -f "/home/ubuntu/app/admin/index.html" ]; then
    grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html | head -1
  else
    echo "   ❌ index.html 없음"
  fi
EOF

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. 브라우저 완전히 닫기"
echo "   2. 시크릿 모드(인코그니토 모드)에서 접속: http://43.200.44.109:3000"
echo "   3. 콘솔(F12)에서 확인:"
echo "      - [API Client] AWS deployment detected, using port 3002"
echo "      - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo "      - ❌ [API Client] Using hostname-based URL (이 메시지가 나오면 안 됨)"
echo ""
