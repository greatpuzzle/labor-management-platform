#!/bin/bash

# 전체 상태 확인 스크립트 (데이터베이스 + 백엔드)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 전체 상태 확인 ==="
echo ""

echo "1. PostgreSQL 연결 테스트 (postgres 사용자로)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  sudo -u postgres psql -c "SELECT version();" 2>&1 | head -3
EOF

echo ""
echo ""

echo "2. labor_user 사용자 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  sudo -u postgres psql -c "SELECT usename FROM pg_user WHERE usename = 'labor_user';" 2>&1 | head -5
EOF

echo ""
echo ""

echo "3. 데이터베이스 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  sudo -u postgres psql -c "\l" 2>&1 | grep labor_management || echo "   데이터베이스를 찾을 수 없습니다"
EOF

echo ""
echo ""

echo "4. 테이블 확인 (postgres 사용자로 접속)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  sudo -u postgres psql -d labor_management -c "\dt" 2>&1 | head -15
EOF

echo ""
echo ""

echo "5. Users 테이블 데이터 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  sudo -u postgres psql -d labor_management -c "SELECT email, name, role FROM users LIMIT 5;" 2>&1 | head -8
EOF

echo ""
echo ""

echo "6. 백엔드 에러 로그 (최근 30줄)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs backend-api --err --lines 30 --nostream 2>/dev/null | tail -40" || echo "❌ 로그를 확인할 수 없습니다"
echo ""
echo ""

echo "7. 백엔드 출력 로그 (최근 20줄)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs backend-api --lines 20 --nostream 2>/dev/null | tail -25" || echo "❌ 로그를 확인할 수 없습니다"
echo ""
echo ""
