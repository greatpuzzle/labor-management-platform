#!/bin/bash

# PostgreSQL 사용자 및 비밀번호 재설정 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PostgreSQL 사용자 및 비밀번호 재설정 ==="
echo ""

echo "1. PostgreSQL에 postgres 사용자로 접속하여 사용자 확인 및 재설정..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  # 데이터베이스가 없으면 생성
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'labor_management'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE labor_management"
  
  # 사용자가 없으면 생성, 있으면 비밀번호 재설정
  if sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'labor_user'" | grep -q 1; then
    echo "   기존 사용자 발견, 비밀번호 재설정 중..."
    sudo -u postgres psql -c "ALTER USER labor_user WITH PASSWORD 'labor_password_123';"
  else
    echo "   사용자가 없음, 생성 중..."
    sudo -u postgres psql -c "CREATE USER labor_user WITH PASSWORD 'labor_password_123';"
  fi
  
  # 데이터베이스 권한 부여
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE labor_management TO labor_user;"
  
  # 스키마 권한 부여 (데이터베이스에 연결하여)
  sudo -u postgres psql -d labor_management -c "GRANT ALL ON SCHEMA public TO labor_user;"
  sudo -u postgres psql -d labor_management -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO labor_user;"
  sudo -u postgres psql -d labor_management -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO labor_user;"
  sudo -u postgres psql -d labor_management -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO labor_user;"
  
  # 기존 테이블이 있다면 권한 부여
  sudo -u postgres psql -d labor_management -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO labor_user;" 2>/dev/null || true
  sudo -u postgres psql -d labor_management -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO labor_user;" 2>/dev/null || true
  
  # 사용자 확인
  if sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'labor_user'" | grep -q 1; then
    echo "   ✅ 사용자 및 비밀번호 설정 완료"
  else
    echo "   ❌ 사용자 설정 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "2. 연결 테스트 (새 비밀번호로)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if command -v psql >/dev/null 2>&1; then
    echo "   psql로 연결 테스트 중..."
    if PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT version();" >/dev/null 2>&1; then
      echo "   ✅ 연결 성공"
    else
      echo "   ❌ 연결 실패"
      PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT version();" 2>&1 | head -3
      exit 1
    fi
  else
    echo "   ⚠️ psql 명령어를 찾을 수 없습니다"
    exit 1
  fi
EOF

echo ""
echo ""

echo "3. Prisma 마이그레이션 실행..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   Prisma generate 중..."
  npx prisma generate 2>&1 | tail -10
  
  echo ""
  echo "   마이그레이션 실행 중..."
  if npx prisma migrate deploy >/dev/null 2>&1; then
    echo "   ✅ 마이그레이션 성공"
  else
    echo "   ❌ 마이그레이션 실패"
    npx prisma migrate deploy 2>&1 | tail -10
    exit 1
  fi
EOF

echo ""
echo ""

echo "4. 시드 데이터 실행 (초기 사용자 생성)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   시드 데이터 실행 중..."
  if npx ts-node prisma/seed.ts >/dev/null 2>&1; then
    echo "   ✅ 시드 데이터 생성 완료"
  else
    echo "   ⚠️  시드 데이터 생성 실패 (이미 데이터가 있을 수 있음)"
    npx ts-node prisma/seed.ts 2>&1 | tail -10
  fi
EOF

echo ""
echo ""

echo "5. 백엔드 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  pm2 restart backend-api
  sleep 3
  
  if pm2 list | grep -q "backend-api.*online"; then
    echo "   ✅ 백엔드 재시작 성공"
  else
    echo "   ⚠️  백엔드 재시작 실패"
  fi
  
  echo ""
  echo "   PM2 상태:"
  pm2 list | grep backend-api
EOF

echo ""
echo ""

echo "✅ PostgreSQL 사용자 및 비밀번호 재설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 다시 로그인 시도"
echo "2. 테스트 계정:"
echo "   - 이메일: company@ecospott.com"
echo "   - 비밀번호: password123"
echo ""
