#!/bin/bash

# 중복 회사 데이터 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 데이터베이스 중복 회사 확인 ==="
echo ""

echo "1. 회사 목록 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   전체 회사 목록:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT id, name, created_at FROM companies ORDER BY created_at;" 2>&1
  
  echo ""
  echo "   회사별 개수:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT name, COUNT(*) as count FROM companies GROUP BY name HAVING COUNT(*) > 1;" 2>&1
EOF

echo ""
echo ""

echo "2. 사용자 목록 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   전체 사용자 목록:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT id, email, name, role, company_id FROM users ORDER BY created_at;" 2>&1
  
  echo ""
  echo "   회사별 사용자 수:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT c.name, COUNT(u.id) as user_count FROM companies c LEFT JOIN users u ON c.id = u.company_id GROUP BY c.id, c.name ORDER BY c.name;" 2>&1
EOF

echo ""
echo ""