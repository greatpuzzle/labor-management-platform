#!/bin/bash

# 백엔드 로그 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 백엔드 로그 확인 ==="
echo ""

echo "1. PM2 프로세스 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list | grep backend-api" || echo "❌ backend-api 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "2. 백엔드 로그 (최근 50줄):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs backend-api --lines 50 --nostream 2>/dev/null" || echo "❌ 로그를 확인할 수 없습니다"
echo ""
echo ""

echo "3. 백엔드 에러 로그만 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs backend-api --err --lines 30 --nostream 2>/dev/null" || echo "❌ 에러 로그를 확인할 수 없습니다"
echo ""
echo ""

echo "4. 백엔드 헬스 체크:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "curl -s http://localhost:3002/api/health 2>/dev/null | head -10" || echo "❌ 헬스 체크 실패"
echo ""
echo ""

echo "5. 백엔드 포트 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :3002 2>/dev/null | head -5" || echo "포트 3002 사용 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "6. 백엔드 디렉토리 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -d "/home/ubuntu/app/backend" ]; then
    echo "   ✅ 백엔드 디렉토리 존재"
    echo "   주요 파일:"
    ls -lh /home/ubuntu/app/backend/dist/src/main.js 2>/dev/null || echo "   ❌ main.js 없음"
    ls -lh /home/ubuntu/app/backend/.env 2>/dev/null || echo "   ⚠️ .env 파일 없음"
  else
    echo "   ❌ 백엔드 디렉토리 없음"
  fi
EOF

echo ""
echo ""
