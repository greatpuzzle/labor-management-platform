#!/bin/bash

# Prisma 마이그레이션 실패 해결 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== Prisma 마이그레이션 실패 해결 ==="
echo ""

echo "1. 실패한 마이그레이션 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   마이그레이션 상태 확인..."
  npx prisma migrate status 2>&1 | tail -20
EOF

echo ""
echo ""

echo "2. 실패한 마이그레이션 해결 (rolled back로 표시)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   실패한 마이그레이션을 rolled back으로 표시..."
  npx prisma migrate resolve --rolled-back 20260110145522_add_work_schedules_and_not_started_status 2>&1
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 실패한 마이그레이션 해결 완료"
  else
    echo "   ⚠️  마이그레이션 해결 실패, 다른 방법 시도 중..."
    # 마이그레이션을 applied로 표시 (이미 적용된 경우)
    npx prisma migrate resolve --applied 20260110145522_add_work_schedules_and_not_started_status 2>&1 || echo "   다른 방법 필요"
  fi
EOF

echo ""
echo ""

echo "3. 마이그레이션 재실행..."
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
    npx prisma migrate status 2>&1 | tail -10
    exit 1
  fi
EOF

echo ""
echo ""

echo "4. 시드 데이터 확인 (이미 있으면 건너뜀)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  cd /home/ubuntu/app/backend
  
  echo "   사용자 확인 중..."
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT COUNT(*) as user_count FROM users;" 2>&1 | head -5
  
  echo ""
  echo "   시드 데이터는 이미 있을 수 있으므로 건너뜁니다."
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
echo "📋 다음 단계:"
echo "1. 브라우저에서 로그인 시도"
echo "2. 테스트 계정:"
echo "   - 이메일: company@ecospott.com"
echo "   - 비밀번호: password123"
echo ""