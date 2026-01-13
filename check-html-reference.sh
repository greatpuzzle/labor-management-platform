#!/bin/bash

# HTML 파일 참조 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "🔍 HTML 파일 참조 확인..."
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "1. HTML 파일 확인:"
  if [ -f "/home/ubuntu/app/admin/index.html" ]; then
    echo "   ✅ index.html 존재"
    echo "   파일 크기: $(ls -lh /home/ubuntu/app/admin/index.html | awk '{print $5}')"
    echo "   수정 시간: $(ls -l /home/ubuntu/app/admin/index.html | awk '{print $6, $7, $8}')"
    echo ""
    
    echo "2. HTML 파일이 참조하는 JavaScript:"
    HTML_REF=$(grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html 2>/dev/null | head -1)
    echo "   참조하는 파일: $HTML_REF"
    echo ""
    
    echo "3. 실제 JavaScript 파일:"
    ACTUAL_JS=$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
    if [ -n "$ACTUAL_JS" ]; then
      ACTUAL_JS_NAME=$(basename "$ACTUAL_JS")
      echo "   실제 파일: $ACTUAL_JS_NAME"
      echo ""
      
      if [ "$HTML_REF" = "$ACTUAL_JS_NAME" ]; then
        echo "   ✅ HTML 파일이 올바른 JavaScript 파일을 참조함"
      else
        echo "   ❌ HTML 파일이 잘못된 JavaScript 파일을 참조함!"
        echo "   HTML 참조: $HTML_REF"
        echo "   실제 파일: $ACTUAL_JS_NAME"
        echo "   이것이 문제입니다!"
      fi
    else
      echo "   ❌ JavaScript 파일을 찾을 수 없습니다"
    fi
    
    echo ""
    echo "4. HTML 파일 내용 (JavaScript 참조 부분):"
    grep -A 2 -B 2 'index-.*\.js' /home/ubuntu/app/admin/index.html | head -10
  else
    echo "   ❌ index.html 없음"
  fi
EOF
