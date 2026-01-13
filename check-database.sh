#!/bin/bash

# 데이터베이스 상태 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 데이터베이스 상태 확인 ==="
echo ""

echo "1. PostgreSQL 서비스 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo systemctl status postgresql 2>/dev/null | head -20" || echo "❌ PostgreSQL 서비스 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "2. PostgreSQL 프로세스 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ps aux | grep postgres | grep -v grep | head -5" || echo "PostgreSQL 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "3. PostgreSQL 포트 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :5432 2>/dev/null | head -5" || echo "포트 5432 사용 프로세스를 찾을 수 없습니다 (PostgreSQL이 실행되지 않을 수 있음)"
echo ""
echo ""

echo "4. 백엔드 .env 파일의 DATABASE_URL 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/backend/.env" ]; then
    echo "   DATABASE_URL:"
    grep "^DATABASE_URL=" /home/ubuntu/app/backend/.env 2>/dev/null | sed 's/DATABASE_URL=.*@/DATABASE_URL=***@/' || echo "   ❌ DATABASE_URL 설정 없음"
  else
    echo "   ❌ .env 파일이 없습니다"
  fi
EOF

echo ""
echo ""

echo "5. PostgreSQL 연결 테스트:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if command -v psql >/dev/null 2>&1; then
    echo "   psql로 연결 테스트 중..."
    sudo -u postgres psql -c "SELECT version();" 2>&1 | head -5 || echo "   ❌ PostgreSQL 연결 실패"
  else
    echo "   ⚠️ psql 명령어를 찾을 수 없습니다"
  fi
EOF

echo ""
echo ""

echo "6. PostgreSQL 시작 시도 (필요시):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if sudo systemctl is-active --quiet postgresql; then
    echo "   ✅ PostgreSQL이 이미 실행 중입니다"
  else
    echo "   PostgreSQL이 실행되지 않았습니다. 시작 시도 중..."
    sudo systemctl start postgresql 2>&1
    sleep 2
    if sudo systemctl is-active --quiet postgresql; then
      echo "   ✅ PostgreSQL 시작 성공"
    else
      echo "   ❌ PostgreSQL 시작 실패"
    fi
  fi
EOF

echo ""
echo ""
