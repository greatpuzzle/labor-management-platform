#!/bin/bash

# PostgreSQL 사용자 생성 스크립트 (간단 버전)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PostgreSQL 사용자 생성 (간단 버전) ==="
echo ""

echo "1. 사용자 생성..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  # 데이터베이스가 없으면 생성
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'labor_management';" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE labor_management;"
  
  # 사용자 존재 여부 확인 및 생성/비밀번호 재설정
  if sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'labor_user';" | grep -q 1; then
    echo "   기존 사용자 발견, 비밀번호 재설정 중..."
    sudo -u postgres psql -c "ALTER USER labor_user WITH PASSWORD 'labor_password_123';"
  else
    echo "   사용자가 없음, 생성 중..."
    sudo -u postgres psql -c "CREATE USER labor_user WITH PASSWORD 'labor_password_123';"
  fi
  
  # 권한 부여
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE labor_management TO labor_user;"
  sudo -u postgres psql -d labor_management -c "GRANT ALL ON SCHEMA public TO labor_user;"
  sudo -u postgres psql -d labor_management -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO labor_user;"
  sudo -u postgres psql -d labor_management -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO labor_user;"
  
  # 사용자 확인
  echo ""
  echo "   사용자 확인:"
  sudo -u postgres psql -c "SELECT usename, usesuper FROM pg_user WHERE usename = 'labor_user';"
EOF

echo ""
echo ""

echo "2. 연결 테스트..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT 1;" >/dev/null 2>&1; then
    echo "   ✅ 연결 성공"
  else
    echo "   ❌ 연결 실패"
    PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT 1;" 2>&1 | head -5
  fi
EOF

echo ""
echo ""

echo "3. Prisma 마이그레이션 실행..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   Prisma generate 중..."
  npx prisma generate 2>&1 | tail -5
  
  echo ""
  echo "   마이그레이션 실행 중..."
  if npx prisma migrate deploy 2>&1; then
    echo "   ✅ 마이그레이션 성공"
  else
    echo "   ❌ 마이그레이션 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "4. 시드 데이터 실행..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   시드 데이터 실행 중..."
  if npx ts-node prisma/seed.ts 2>&1; then
    echo "   ✅ 시드 데이터 생성 완료"
  else
    echo "   ⚠️  시드 데이터 생성 실패 (이미 데이터가 있을 수 있음)"
  fi
EOF

echo ""
echo ""

echo "5. 백엔드 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  pm2 restart backend-api
  sleep 3
  pm2 list | grep backend-api
EOF

echo ""
echo "✅ 완료!"
echo ""