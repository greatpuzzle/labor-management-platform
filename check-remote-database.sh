#!/bin/bash

# 원격 데이터베이스 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 원격 데이터베이스 확인 ==="
echo ""

echo "1. 현재 .env 파일의 DATABASE_URL 확인:"
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

echo "2. DATABASE_URL에서 호스트 추출:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/backend/.env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" /home/ubuntu/app/backend/.env 2>/dev/null | cut -d'=' -f2- | tr -d '"')
    if [ -n "$DATABASE_URL" ]; then
      # postgresql://user:pass@host:port/db 형식에서 호스트 추출
      HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
      PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
      echo "   호스트: $HOST"
      echo "   포트: $PORT"
      
      if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        echo "   ⚠️  로컬 데이터베이스를 사용하고 있습니다"
        echo "   → 원격 데이터베이스(RDS)로 변경해야 합니다"
      else
        echo "   ✅ 원격 데이터베이스를 사용하고 있습니다: $HOST"
        echo ""
        echo "   3. 원격 데이터베이스 연결 테스트:"
        echo "   nc -zv $HOST $PORT 2>&1 | head -2"
        nc -zv "$HOST" "$PORT" 2>&1 | head -2 || echo "   ❌ 연결 실패"
      fi
    fi
  fi
EOF

echo ""
echo ""

echo "📋 다음 단계:"
echo ""
echo "만약 원격 데이터베이스(RDS)를 사용해야 한다면:"
echo ""
echo "1. AWS RDS 인스턴스가 생성되어 있는지 확인"
echo "2. RDS 엔드포인트 확인 (예: xxxxx.xxxxx.ap-northeast-2.rds.amazonaws.com)"
echo "3. .env 파일의 DATABASE_URL을 RDS 엔드포인트로 변경"
echo "4. RDS 보안 그룹에서 EC2 인스턴스의 IP를 허용"
echo ""
echo "만약 아직 RDS 인스턴스가 없다면:"
echo "- AWS RDS PostgreSQL 인스턴스를 생성해야 합니다"
echo ""
