#!/bin/bash

# 모바일 앱 배포 상태 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 모바일 앱 배포 상태 확인 ==="
echo ""

echo "1. 배포된 index.html 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ index.html 파일 존재"
    echo ""
    echo "   파일 내용 (API URL 설정 부분):"
    grep -A 20 "백엔드 API URL" /home/ubuntu/app/mobile/index.html 2>/dev/null | head -25
    echo ""
    echo "   파일 수정 시간:"
    ls -l /home/ubuntu/app/mobile/index.html | awk '{print $6, $7, $8, $9}'
  else
    echo "   ❌ index.html 파일이 없습니다"
  fi
EOF

echo ""
echo ""

echo "2. API URL 설정 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   43.200.44.109:3002 포함 여부:"
    if grep -q "43.200.44.109.*3002" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 43.200.44.109:3002 포함됨"
    else
      echo "   ❌ 43.200.44.109:3002 없음"
    fi
    
    echo ""
    echo "   hostname 기반 동적 설정 포함 여부:"
    if grep -q "hostname === '43.200.44.109'" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 동적 설정 포함됨"
    else
      echo "   ❌ 동적 설정 없음"
    fi
    
    echo ""
    echo "   이전 버전 (192.168.45.219:3000) 포함 여부:"
    if grep -q "192.168.45.219:3000" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ⚠️  이전 버전 코드 포함됨"
    else
      echo "   ✅ 이전 버전 코드 없음"
    fi
  fi
EOF

echo ""
echo "✅ 확인 완료!"
echo ""