#!/bin/bash

# 서버에 배포된 모바일 앱 버전 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 서버에 배포된 모바일 앱 버전 확인..."
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "=== 서버 파일 확인 ==="
  
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "✅ index.html 존재"
    echo ""
    
    echo "=== PhoneLogin 컴포넌트 확인 ==="
    if grep -r "PhoneLogin\|핸드폰 인증" /home/ubuntu/app/mobile/assets/*.js 2>/dev/null | head -3; then
      echo "✅ PhoneLogin 컴포넌트 포함됨"
    else
      echo "❌ PhoneLogin 컴포넌트 없음"
    fi
    echo ""
    
    echo "=== App.tsx 핸드폰 인증 로직 확인 ==="
    if grep -r "handlePhoneLoginSuccess\|010-1234-1234\|인증번호" /home/ubuntu/app/mobile/assets/*.js 2>/dev/null | head -3; then
      echo "✅ 핸드폰 인증 로직 포함됨"
    else
      echo "❌ 핸드폰 인증 로직 없음"
    fi
    echo ""
    
    echo "=== 최근 수정된 파일 ==="
    ls -lt /home/ubuntu/app/mobile/assets/*.js 2>/dev/null | head -3
    echo ""
    
    echo "=== index.html 일부 내용 ==="
    head -100 /home/ubuntu/app/mobile/index.html | grep -A 5 -B 5 "VITE_API_URL\|hostname" | head -20
    
  else
    echo "❌ index.html을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 확인 완료"
