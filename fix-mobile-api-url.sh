#!/bin/bash

# 모바일 앱 API URL 문제 해결 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 모바일 앱 API URL 문제 해결..."
echo ""

# 1. 로컬 빌드 확인 및 재빌드
echo "1. 로컬 빌드 확인 및 재빌드..."
cd "$LOCAL_DIR/apps/mobile"

echo "   기존 빌드 파일 삭제 중..."
rm -rf dist node_modules/.vite

echo "   새로 빌드 중..."
npm run build 2>&1 | tail -15

if [ ! -f "dist/index.html" ]; then
  echo "   ❌ 빌드 실패"
  exit 1
fi

# 빌드된 파일 확인
if grep -q "hostname === '43.200.44.109'" dist/index.html 2>/dev/null; then
  echo "   ✅ 새 코드 포함됨"
else
  echo "   ❌ 새 코드 없음"
  exit 1
fi

echo ""

# 2. 서버에서 기존 파일 완전 삭제
echo "2. 서버에서 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   기존 파일 삭제 중..."
  rm -rf /home/ubuntu/app/mobile/*
  rm -rf /home/ubuntu/app/mobile/.* 2>/dev/null || true
  echo "   ✅ 삭제 완료"
EOF

echo ""

# 3. 새 파일 업로드
echo "3. 새 파일 업로드..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/mobile/dist/"* "$EC2_HOST:~/app/mobile/" 2>&1 | tail -10

echo ""

# 4. PM2 재시작
echo "4. PM2 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   mobile-page 재시작 중..."
  pm2 restart mobile-page
  sleep 2
  pm2 list | grep mobile
  echo "   ✅ 재시작 완료"
EOF

echo ""

# 5. 배포 확인
echo "5. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ index.html 확인됨"
    echo "   수정 시간: $(ls -l /home/ubuntu/app/mobile/index.html | awk '{print $6, $7, $8}')"
    echo ""
    
    if grep -q "hostname === '43.200.44.109'" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 새 코드 포함됨"
    else
      echo "   ❌ 새 코드 없음"
    fi
    
    if grep -q "43.200.44.109.*3002" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 포트 3002 설정 확인됨"
    else
      echo "   ⚠️  포트 3002 설정 확인 필요"
    fi
    
    if grep -q "192.168.45.219" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ❌ 이전 버전 코드 포함됨!"
    else
      echo "   ✅ 이전 버전 코드 없음"
    fi
  else
    echo "   ❌ index.html 파일 없음"
  fi
EOF

echo ""
echo "✅ 완료!"
echo ""
echo "📋 다음 단계 (중요!):"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드(인코그니토)로 열기"
echo "3. http://43.200.44.109:3001/invite.html?invite=... 접속"
echo "4. 개발자 도구(F12) → Application → Service Workers → Unregister"
echo "5. Application → Cache Storage → 모든 항목 삭제"
echo "6. Application → Clear storage → Clear site data"
echo "7. Network 탭 → 'Disable cache' 체크"
echo "8. 하드 리프레시: Ctrl+Shift+R (Mac: Cmd+Shift+R)"
echo "9. 콘솔에서 확인: [HTML] Backend API URL set to: http://43.200.44.109:3002"
echo ""
