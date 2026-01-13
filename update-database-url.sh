#!/bin/bash

# DATABASE_URL 업데이트 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== DATABASE_URL 업데이트 ==="
echo ""
echo "이 스크립트는 .env 파일의 DATABASE_URL을 업데이트합니다."
echo ""

# 사용자 입력 받기
read -p "데이터베이스 호스트 (예: xxxxx.rds.amazonaws.com 또는 IP): " DB_HOST
read -p "데이터베이스 포트 (기본값: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}
read -p "데이터베이스 사용자 이름: " DB_USER
read -s -p "데이터베이스 비밀번호: " DB_PASSWORD
echo ""
read -p "데이터베이스 이름 (기본값: labor_management): " DB_NAME
DB_NAME=${DB_NAME:-labor_management}

# DATABASE_URL 생성
NEW_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo ""
echo "새로운 DATABASE_URL:"
echo "postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
echo ""
read -p "이 정보로 업데이트하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "취소되었습니다."
  exit 1
fi

echo ""
echo "서버에 연결하여 .env 파일 업데이트 중..."

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  BACKEND_DIR="/home/ubuntu/app/backend"
  
  if [ ! -f "\$BACKEND_DIR/.env" ]; then
    echo "   ❌ .env 파일이 없습니다"
    exit 1
  fi
  
  # 백업 생성
  cp "\$BACKEND_DIR/.env" "\$BACKEND_DIR/.env.backup.\$(date +%Y%m%d%H%M%S)"
  echo "   ✅ 백업 생성 완료"
  
  # 기존 DATABASE_URL 주석 처리
  sed -i 's/^DATABASE_URL=/#DATABASE_URL=/' "\$BACKEND_DIR/.env"
  
  # 새 DATABASE_URL 추가
  echo "" >> "\$BACKEND_DIR/.env"
  echo "# Updated DATABASE_URL - $(date)" >> "\$BACKEND_DIR/.env"
  echo "DATABASE_URL=\"${NEW_DATABASE_URL}\"" >> "\$BACKEND_DIR/.env"
  
  echo "   ✅ .env 파일 업데이트 완료"
  echo ""
  echo "   업데이트된 DATABASE_URL (일부만 표시):"
  grep "^DATABASE_URL=" "\$BACKEND_DIR/.env" 2>/dev/null | sed 's/\(.*@\).*\(:5432.*\)/\1***\2/' || echo "   확인 실패"
EOF

echo ""
echo "✅ DATABASE_URL 업데이트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Prisma 마이그레이션 실행:"
echo "   ssh -i $SSH_KEY_PATH $EC2_HOST 'cd /home/ubuntu/app/backend && npx prisma migrate deploy'"
echo ""
echo "2. 백엔드 재시작:"
echo "   ssh -i $SSH_KEY_PATH $EC2_HOST 'pm2 restart backend-api'"
echo ""
