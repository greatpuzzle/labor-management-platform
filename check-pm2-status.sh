#!/bin/bash

# PM2 상태 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PM2 상태 확인 ==="
echo ""

echo "1. PM2 전체 프로세스 목록:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list" || echo "❌ PM2 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "2. admin-page 프로세스 상세 정보:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    echo "   프로세스 정보:"
    pm2 describe admin-page 2>/dev/null | head -30
  else
    echo "   ⚠️ admin-page 프로세스를 찾을 수 없습니다"
  fi
EOF

echo ""
echo ""

echo "3. admin-page 프로세스 로그 (최근 20줄):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs admin-page --lines 20 --nostream 2>/dev/null" || echo "❌ 로그를 확인할 수 없습니다"
echo ""
echo ""

echo "4. admin-page 프로세스 재시작 시간 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    UPTIME=$(pm2 list | grep admin-page | awk '{print $10}')
    echo "   Uptime: $UPTIME"
    echo "   (Uptime이 매우 짧으면 최근에 재시작됨)"
  fi
EOF

echo ""
echo ""

echo "5. 포트 3000 사용 프로세스:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :3000 2>/dev/null | head -5" || echo "포트 3000 사용 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "6. 강제로 admin-page 재시작:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "admin-page"; then
    echo "   재시작 중..."
    pm2 restart admin-page --update-env
    sleep 3
    echo "   ✅ 재시작 완료"
    echo ""
    echo "   재시작 후 상태:"
    pm2 list | grep admin-page
  else
    echo "   ⚠️ admin-page 프로세스를 찾을 수 없습니다"
  fi
EOF

echo ""
echo ""
