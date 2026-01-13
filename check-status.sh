#!/bin/bash
# 빠른 상태 확인
EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 현재 상태 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'SSH_EOF'
  echo "1. PM2 프로세스 (기존 프로세스는 정상):"
  pm2 list
  
  echo ""
  echo "2. 백엔드 배포 상태:"
  if [ -d "/home/ubuntu/app/backend" ]; then
    cd /home/ubuntu/app/backend
    echo "   디렉토리: $(pwd)"
    echo "   node_modules: $([ -d node_modules ] && echo '✅ 존재' || echo '❌ 없음')"
    echo "   dist: $([ -d dist ] && echo '✅ 존재' || echo '❌ 없음')"
    echo "   실행 중인 npm: $(ps aux | grep -c '[n]pm install' || echo '0') 개"
  else
    echo "   ❌ 디렉토리 없음"
  fi
  
  echo ""
  echo "3. 포트 3002:"
  (netstat -tuln 2>/dev/null | grep ':3002' || ss -tuln 2>/dev/null | grep ':3002' || echo "   사용 안 됨")
SSH_EOF
