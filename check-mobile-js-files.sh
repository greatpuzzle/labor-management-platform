#!/bin/bash

# 모바일 앱 JavaScript 파일 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 모바일 앱 JavaScript 파일 확인 ==="
echo ""

echo "1. 배포된 JavaScript 파일 목록..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "   assets 디렉토리 내용:"
  ls -lh /home/ubuntu/app/mobile/assets/ 2>/dev/null | head -10
  
  echo ""
  echo "   index-*.js 파일:"
  ls -lh /home/ubuntu/app/mobile/assets/index-*.js 2>/dev/null
  
  echo ""
  echo "   최근 수정된 파일:"
  ls -lt /home/ubuntu/app/mobile/assets/*.js 2>/dev/null | head -5
EOF

echo ""
echo ""

echo "2. index.html에서 참조하는 JavaScript 파일 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   index.html에서 JavaScript 파일 참조:"
    grep -o 'src="[^"]*\.js"' /home/ubuntu/app/mobile/index.html 2>/dev/null | head -5
  fi
EOF

echo ""
echo "✅ 확인 완료!"
echo ""