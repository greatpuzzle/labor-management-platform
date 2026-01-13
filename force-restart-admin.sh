#!/bin/bash

# Admin 웹 서버 강제 재시작 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== Admin 웹 서버 강제 재시작 ==="
echo ""

echo "1. 현재 PM2 프로세스 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list" || echo "❌ PM2 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "2. admin-page 프로세스 재시작:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    echo "   admin-page 프로세스 발견, 재시작 중..."
    pm2 restart admin-page
    echo "   ✅ admin-page 재시작 완료"
  else
    echo "   ⚠️ admin-page 프로세스를 찾을 수 없습니다"
    echo "   전체 PM2 프로세스 목록:"
    pm2 list
  fi
EOF

echo ""
echo ""

echo "3. 재시작 후 PM2 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list" || echo "❌ PM2 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "✅ 재시작 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드에서 접속: http://43.200.44.109:3000"
echo "3. Network 탭에서 로드되는 파일 확인"
