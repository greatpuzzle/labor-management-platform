#!/bin/bash

# PostgreSQL 설치 및 설정 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== PostgreSQL 설치 및 설정 ==="
echo ""

echo "⚠️  주의: 이 스크립트는 EC2 서버에 PostgreSQL을 설치합니다."
echo "   원격 데이터베이스(RDS)를 사용하는 경우 이 스크립트를 실행하지 마세요."
echo ""
read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

echo ""

echo "1. PostgreSQL 설치..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  # 시스템 업데이트
  sudo apt update
  
  # PostgreSQL 설치
  sudo apt install -y postgresql postgresql-contrib
  
  # PostgreSQL 시작
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  
  # 설치 확인
  if sudo systemctl is-active --quiet postgresql; then
    echo "   ✅ PostgreSQL 설치 및 시작 성공"
  else
    echo "   ❌ PostgreSQL 시작 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "2. PostgreSQL 데이터베이스 및 사용자 생성..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  # PostgreSQL에 접속하여 데이터베이스 생성
  sudo -u postgres psql << 'PSQL'
    -- 데이터베이스 생성 (이미 있으면 무시)
    SELECT 'CREATE DATABASE labor_management'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'labor_management')\gexec
    
    -- 사용자 생성 (이미 있으면 무시)
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'labor_user') THEN
        CREATE USER labor_user WITH PASSWORD 'labor_password_123';
        GRANT ALL PRIVILEGES ON DATABASE labor_management TO labor_user;
      END IF;
    END
    \$\$;
    
    -- 데이터베이스에 연결하여 스키마 권한 부여
    \c labor_management
    GRANT ALL ON SCHEMA public TO labor_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO labor_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO labor_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO labor_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO labor_user;
PSQL
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 데이터베이스 및 사용자 생성 성공"
  else
    echo "   ❌ 데이터베이스 생성 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "3. 백엔드 .env 파일 업데이트..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  BACKEND_DIR="/home/ubuntu/app/backend"
  
  if [ -f "$BACKEND_DIR/.env" ]; then
    # 백업 생성
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.backup.$(date +%Y%m%d%H%M%S)"
    
    # DATABASE_URL 업데이트
    if grep -q "^DATABASE_URL=" "$BACKEND_DIR/.env"; then
      # 기존 DATABASE_URL 주석 처리
      sed -i 's/^DATABASE_URL=/#DATABASE_URL=/' "$BACKEND_DIR/.env"
    fi
    
    # 새 DATABASE_URL 추가
    echo "" >> "$BACKEND_DIR/.env"
    echo "# Updated DATABASE_URL for local PostgreSQL" >> "$BACKEND_DIR/.env"
    echo "DATABASE_URL=\"postgresql://labor_user:labor_password_123@localhost:5432/labor_management?schema=public\"" >> "$BACKEND_DIR/.env"
    
    echo "   ✅ .env 파일 업데이트 완료"
    echo "   백업: $BACKEND_DIR/.env.backup.*"
  else
    echo "   ⚠️ .env 파일이 없습니다. 수동으로 생성하세요."
  fi
EOF

echo ""
echo ""

echo "4. Prisma 마이그레이션 실행..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  # Prisma generate
  npx prisma generate
  
  # 마이그레이션 실행
  npx prisma migrate deploy
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 마이그레이션 성공"
  else
    echo "   ⚠️  마이그레이션 실패 (테이블이 이미 있을 수 있음)"
  fi
EOF

echo ""
echo ""

echo "5. 백엔드 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  pm2 restart backend-api
  sleep 2
  
  if pm2 list | grep -q "backend-api.*online"; then
    echo "   ✅ 백엔드 재시작 성공"
  else
    echo "   ⚠️  백엔드 재시작 실패"
  fi
EOF

echo ""
echo ""

echo "✅ PostgreSQL 설치 및 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저에서 다시 로그인 시도"
echo "2. 데이터베이스 연결이 성공하는지 확인"
echo ""
echo "⚠️  참고: 기본 비밀번호는 'labor_password_123'입니다."
echo "   프로덕션 환경에서는 더 강력한 비밀번호를 사용하세요."
echo ""
