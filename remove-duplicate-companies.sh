#!/bin/bash

# 중복 회사 데이터 제거 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 중복 회사 데이터 제거 ==="
echo ""
echo "⚠️  주의: 이 스크립트는 각 회사 이름별로 가장 오래된 것만 남기고 나머지를 삭제합니다."
echo ""

echo "1. 현재 상태 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   전체 회사 목록 (ID 포함):"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT id, name, \"createdAt\" FROM companies ORDER BY name, \"createdAt\";" 2>&1
  
  echo ""
  echo "   중복된 회사 확인:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT name, COUNT(*) as count FROM companies GROUP BY name HAVING COUNT(*) > 1;" 2>&1
  
  echo ""
  echo "   사용자와 연결된 회사:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT u.email, u.name as user_name, c.name as company_name, c.id as company_id FROM users u LEFT JOIN companies c ON u.\"companyId\" = c.id ORDER BY u.email;" 2>&1
EOF

echo ""
echo ""

echo "2. 중복 회사 제거 (각 이름별로 가장 오래된 것만 유지)..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management << 'SQL'
    -- 각 회사 이름별로 가장 오래된 것(id가 가장 작은 것)만 유지하고 나머지 삭제
    -- 사용자가 연결된 회사도 가장 오래된 것으로 유지
    
    -- 보존할 회사 ID (각 이름별로 가장 오래된 것)
    WITH companies_to_keep AS (
      SELECT DISTINCT ON (name) id
      FROM companies
      ORDER BY name, id
    )
    DELETE FROM companies
    WHERE id NOT IN (SELECT id FROM companies_to_keep);
SQL
  
  if [ $? -eq 0 ]; then
    echo "   ✅ 중복 회사 제거 완료"
  else
    echo "   ❌ 중복 제거 실패"
    exit 1
  fi
EOF

echo ""
echo ""

echo "3. 최종 상태 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   최종 회사 목록:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT id, name, \"createdAt\" FROM companies ORDER BY name;" 2>&1
  
  echo ""
  echo "   중복 확인 (중복이 없어야 함):"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT name, COUNT(*) as count FROM companies GROUP BY name HAVING COUNT(*) > 1;" 2>&1
  
  echo ""
  echo "   사용자 목록:"
  PGPASSWORD=labor_password_123 psql -h localhost -U labor_user -d labor_management -c "SELECT u.id, u.email, u.name, u.role, c.name as company_name FROM users u LEFT JOIN companies c ON u.\"companyId\" = c.id ORDER BY u.\"createdAt\";" 2>&1
EOF

echo ""
echo "✅ 완료!"
echo ""