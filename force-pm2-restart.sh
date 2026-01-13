#!/bin/bash

# PM2 강제 재시작 스크립트 (delete + start)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PM2 강제 재시작 (delete + start) ==="
echo ""

echo "1. 현재 PM2 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list" || echo "❌ PM2 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "2. admin-page 프로세스 강제 재시작 (delete + start)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    echo "   admin-page 프로세스 삭제 중..."
    pm2 delete admin-page 2>/dev/null || echo "   삭제 실패 (이미 없을 수 있음)"
    
    echo "   admin-page 프로세스 시작 중..."
    cd /home/ubuntu/app/admin
    pm2 serve . 3000 --name admin-page --spa 2>/dev/null || pm2 start "npx serve -s . -l 3000" --name admin-page
    
    sleep 2
    
    echo "   ✅ admin-page 재시작 완료"
  else
    echo "   ⚠️ admin-page 프로세스를 찾을 수 없습니다"
    echo "   새로 시작 중..."
    cd /home/ubuntu/app/admin
    pm2 serve . 3000 --name admin-page --spa 2>/dev/null || pm2 start "npx serve -s . -l 3000" --name admin-page
    sleep 2
    echo "   ✅ admin-page 시작 완료"
  fi
EOF

echo ""
echo ""

echo "3. 재시작 후 PM2 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list" || echo "❌ PM2 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "4. PM2 저장 (프로세스 목록 저장):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 save" || echo "❌ PM2 save 실패"
echo ""
echo ""

echo "5. 포트 3000 사용 프로세스 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :3000 2>/dev/null | head -5" || echo "포트 3000 사용 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "✅ PM2 강제 재시작 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드에서 접속: http://43.200.44.109:3000"
echo "3. Network 탭에서 로드되는 파일 확인"
echo ""
