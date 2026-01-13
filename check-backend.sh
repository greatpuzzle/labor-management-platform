#!/bin/bash

# 백엔드 상태 확인

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 백엔드 상태 확인..."
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "1. PM2 프로세스 상태:"
  pm2 list
  echo ""
  
  echo "2. 백엔드 로그 (최근 10줄):"
  pm2 logs backend-api --lines 10 --nostream 2>/dev/null || echo "로그 없음"
  echo ""
  
  echo "3. 백엔드 헬스 체크 (포트 3002):"
  curl -s http://localhost:3002/api/health | head -5 || echo "헬스 체크 실패"
  echo ""
  
  echo "4. 포트 사용 현황:"
  echo "   포트 3000:"
  (sudo lsof -i :3000 2>/dev/null | head -2 || netstat -tuln 2>/dev/null | grep ':3000' || echo "   사용 안 됨")
  echo ""
  echo "   포트 3002:"
  (sudo lsof -i :3002 2>/dev/null | head -2 || netstat -tuln 2>/dev/null | grep ':3002' || echo "   사용 안 됨")
  echo ""
  
  echo "5. 백엔드 디렉토리 확인:"
  if [ -d "/home/ubuntu/app/backend" ]; then
    echo "   ✅ 백엔드 디렉토리 존재: /home/ubuntu/app/backend"
    echo "   파일 목록:"
    ls -lh /home/ubuntu/app/backend/ | head -10
  else
    echo "   ❌ 백엔드 디렉토리 없음"
  fi
  echo ""
  
  echo "6. 백엔드 .env 파일 확인:"
  if [ -f "/home/ubuntu/app/backend/.env" ]; then
    echo "   ✅ .env 파일 존재"
    echo "   PORT 설정:"
    grep "^PORT=" /home/ubuntu/app/backend/.env || echo "   PORT 설정 없음"
  else
    echo "   ❌ .env 파일 없음"
  fi
  echo ""
  
  echo "7. 백엔드 ecosystem.config.js 확인:"
  if [ -f "/home/ubuntu/app/backend/ecosystem.config.js" ]; then
    echo "   ✅ ecosystem.config.js 존재"
    echo "   PORT 설정:"
    grep "PORT:" /home/ubuntu/app/backend/ecosystem.config.js || echo "   PORT 설정 없음"
  else
    echo "   ⚠️  ecosystem.config.js 없음"
  fi
EOF
