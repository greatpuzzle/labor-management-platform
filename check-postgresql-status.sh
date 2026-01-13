#!/bin/bash

# PostgreSQL 설치 후 상태 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PostgreSQL 설치 후 상태 확인 ==="
echo ""

echo "1. PostgreSQL 서비스 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo systemctl status postgresql 2>/dev/null | head -10" || echo "❌ PostgreSQL 서비스 상태를 확인할 수 없습니다"
echo ""
echo ""

echo "2. PostgreSQL 포트 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :5432 2>/dev/null | head -5" || echo "⚠️  PostgreSQL이 포트 5432에서 실행되지 않을 수 있습니다"
echo ""
echo ""

echo "3. PostgreSQL 연결 테스트:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if command -v psql >/dev/null 2>&1; then
    echo "   psql로 연결 테스트 중..."
    PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT version();" 2>&1 | head -5 || echo "   ❌ PostgreSQL 연결 실패"
  else
    echo "   ⚠️ psql 명령어를 찾을 수 없습니다"
  fi
EOF

echo ""
echo ""

echo "4. 데이터베이스 및 테이블 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if command -v psql >/dev/null 2>&1; then
    echo "   테이블 목록:"
    PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "\dt" 2>&1 | head -10
    
    echo ""
    echo "   Users 테이블 확인:"
    PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT COUNT(*) FROM users;" 2>&1 | head -3
    
    echo ""
    echo "   Users 데이터 확인:"
    PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT email, name, role FROM users LIMIT 5;" 2>&1 | head -8
  else
    echo "   ⚠️ psql 명령어를 찾을 수 없습니다"
  fi
EOF

echo ""
echo ""

echo "5. .env 파일의 DATABASE_URL 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/backend/.env" ]; then
    echo "   DATABASE_URL (일부만 표시):"
    grep "^DATABASE_URL=" /home/ubuntu/app/backend/.env 2>/dev/null | sed 's/\(.*@\).*\(:5432.*\)/\1***\2/' || echo "   ❌ DATABASE_URL 설정 없음"
  else
    echo "   ❌ .env 파일이 없습니다"
  fi
EOF

echo ""
echo ""

echo "6. 백엔드 로그 확인 (최근 20줄):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 logs backend-api --err --lines 20 --nostream 2>/dev/null | tail -30" || echo "❌ 로그를 확인할 수 없습니다"
echo ""
echo ""

echo "7. 백엔드 헬스 체크:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "curl -s http://localhost:3002/api/health 2>/dev/null | head -5" || echo "❌ 헬스 체크 실패"
echo ""
echo ""
