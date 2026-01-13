#!/bin/bash

# 서버 파일 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 서버 파일 확인..."
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "1. 배포된 JavaScript 파일 목록:"
  ls -lth /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -5
  
  echo ""
  echo "2. 가장 최근 파일 확인:"
  DEPLOYED_JS=$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   파일: $(basename $DEPLOYED_JS)"
    echo "   크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
    
    echo ""
    echo "3. 파일 내용 확인:"
    echo "   'Using hostname-based URL' 검색:"
    if grep -q "Using hostname-based URL" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ❌ 이전 버전 로그 포함됨!"
      echo "   위치: $(grep -n 'Using hostname-based URL' "$DEPLOYED_JS" | head -1 | cut -d: -f1)"
    else
      echo "   ✅ 이전 버전 로그 없음"
    fi
    
    echo ""
    echo "   'AWS deployment detected' 검색:"
    if grep -q "AWS deployment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 새 코드 포함됨"
      echo "   위치: $(grep -n 'AWS deployment detected' "$DEPLOYED_JS" | head -1 | cut -d: -f1)"
    else
      echo "   ❌ 새 코드 없음"
    fi
    
    echo ""
    echo "   'Production environment detected' 검색:"
    if grep -q "Production environment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 새 코드 포함됨"
    else
      echo "   ❌ 새 코드 없음"
    fi
    
    echo ""
    echo "4. 파일의 일부 내용 (API URL 부분):"
    grep -A 3 -B 3 "43.200.44.109" "$DEPLOYED_JS" 2>/dev/null | head -10 || echo "   검색 결과 없음"
  else
    echo "   ❌ JavaScript 파일을 찾을 수 없습니다"
  fi
  
  echo ""
  echo "5. HTML 파일 확인:"
  if [ -f "/home/ubuntu/app/admin/index.html" ]; then
    echo "   HTML이 참조하는 JavaScript:"
    grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html | head -1
    echo ""
    echo "   HTML 파일 수정 시간:"
    ls -l /home/ubuntu/app/admin/index.html | awk '{print $6, $7, $8}'
  else
    echo "   ❌ index.html 없음"
  fi
EOF
