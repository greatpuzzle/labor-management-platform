#!/bin/bash

# 배포된 파일 직접 확인 및 수정

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 배포된 파일 직접 확인..."
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  
  if [ -z "$DEPLOYED_JS" ]; then
    echo "❌ 배포된 JavaScript 파일을 찾을 수 없습니다."
    exit 1
  fi
  
  echo "배포된 파일: $DEPLOYED_JS"
  echo "파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
  echo "수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
  echo ""
  
  echo "1. '43.200.44.109' 검색:"
  if grep -q "43.200.44.109" "$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 포함됨"
    grep -o "[^,]*43.200.44.109[^,]*" "$DEPLOYED_JS" 2>/dev/null | head -2
  else
    echo "   ❌ 없음"
  fi
  
  echo ""
  echo "2. '3002' 검색:"
  if grep -q "3002" "$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 포함됨"
    grep -o "[^,]*3002[^,]*" "$DEPLOYED_JS" 2>/dev/null | head -3
  else
    echo "   ❌ 없음"
  fi
  
  echo ""
  echo "3. '3000' 검색 (문제):"
  if grep -q "43.200.44.109.*3000\|hostname.*3000" "$DEPLOYED_JS" 2>/dev/null; then
    echo "   ⚠️  문제 발견: 43.200.44.109와 3000 함께 발견"
    grep -o "[^,]*43.200.44.109[^,]*3000[^,]*" "$DEPLOYED_JS" 2>/dev/null | head -2
  else
    echo "   ✅ 43.200.44.109와 3000 함께 없음"
  fi
  
  echo ""
  echo "4. 'AWS deployment detected' 검색:"
  if grep -q "AWS deployment detected" "$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 포함됨"
    grep -o "AWS deployment detected[^\"']*" "$DEPLOYED_JS" 2>/dev/null | head -1
  else
    echo "   ❌ 없음"
  fi
  
  echo ""
  echo "5. 'Using hostname-based URL' 검색 (이전 버전):"
  if grep -q "Using hostname-based URL" "$DEPLOYED_JS" 2>/dev/null; then
    echo "   ⚠️  이전 버전 로그 포함됨"
    grep -o "Using hostname-based URL[^\"']*" "$DEPLOYED_JS" 2>/dev/null | head -1
  else
    echo "   ✅ 이전 버전 로그 없음"
  fi
  
  echo ""
  echo "6. 파일 해시 (변경 확인용):"
  md5sum "$DEPLOYED_JS" 2>/dev/null || echo "   md5sum 없음"
EOF
