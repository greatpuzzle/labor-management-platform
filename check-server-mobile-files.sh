#!/bin/bash

# 서버에 배포된 모바일 앱 파일 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 서버에 배포된 모바일 앱 파일 확인 ==="
echo ""

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  echo "1. index.html 파일 확인:"
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ 파일 존재"
    echo "   파일 크기: $(ls -lh /home/ubuntu/app/mobile/index.html | awk '{print $5}')"
    echo "   수정 시간: $(ls -l /home/ubuntu/app/mobile/index.html | awk '{print $6, $7, $8}')"
    echo ""
    
    echo "2. index.html 내용 확인:"
    echo "   --- API URL 설정 코드 ---"
    grep -A 15 "백엔드 API URL" /home/ubuntu/app/mobile/index.html | head -20
    echo ""
    
    echo "3. 43.200.44.109 포함 여부:"
    if grep -q "43.200.44.109" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 43.200.44.109 포함됨"
      if grep -q "43.200.44.109.*3002" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
        echo "   ✅ 포트 3002 설정 확인됨"
      else
        echo "   ⚠️  포트 3002 설정 없음"
      fi
    else
      echo "   ❌ 43.200.44.109 없음"
    fi
    echo ""
    
    echo "4. 192.168.45.219 포함 여부:"
    if grep -q "192.168.45.219" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ❌ 이전 버전 코드 포함됨!"
    else
      echo "   ✅ 이전 버전 코드 없음"
    fi
    echo ""
    
    echo "5. JavaScript 파일 확인:"
    JS_FILE=$(grep -o 'src="/assets/index-[^"]*\.js"' /home/ubuntu/app/mobile/index.html | sed 's/src="\/assets\///; s/"//')
    if [ -n "$JS_FILE" ]; then
      echo "   로드되는 JS 파일: $JS_FILE"
      if [ -f "/home/ubuntu/app/mobile/assets/$JS_FILE" ]; then
        echo "   ✅ 파일 존재"
        echo "   파일 크기: $(ls -lh /home/ubuntu/app/mobile/assets/$JS_FILE | awk '{print $5}')"
        echo "   수정 시간: $(ls -l /home/ubuntu/app/mobile/assets/$JS_FILE | awk '{print $6, $7, $8}')"
      else
        echo "   ❌ 파일 없음"
      fi
    fi
  else
    echo "   ❌ index.html 파일 없음"
  fi
EOF

echo ""
echo "✅ 확인 완료"
echo ""
