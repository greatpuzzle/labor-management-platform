#!/bin/bash

# 모바일 앱 서버 재시작 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 모바일 앱 서버 재시작 ==="
echo ""

echo "1. 현재 PM2 상태 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list | grep -E 'mobile|name|status'" || echo "PM2 상태 확인 실패"
echo ""
echo ""

echo "2. mobile-page 프로세스 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if pm2 list | grep -q "mobile-page"; then
    echo "   mobile-page 프로세스 재시작 중..."
    pm2 restart mobile-page
    
    sleep 2
    
    echo "   ✅ mobile-page 재시작 완료"
  else
    echo "   ⚠️ mobile-page 프로세스를 찾을 수 없습니다"
    echo "   새로 시작 중..."
    cd /home/ubuntu/app/mobile
    pm2 serve . 3001 --name mobile-page --spa 2>/dev/null || pm2 start "npx serve -s . -l 3001" --name mobile-page
    sleep 2
    echo "   ✅ mobile-page 시작 완료"
  fi
EOF

echo ""
echo ""

echo "3. 재시작 후 PM2 상태:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list | grep -E 'mobile|name|status'"
echo ""
echo ""

echo "4. 배포된 파일 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ index.html 존재"
    echo "   파일 수정 시간: $(ls -l /home/ubuntu/app/mobile/index.html | awk '{print $6, $7, $8}')"
    
    if grep -q "hostname === '43.200.44.109'" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 새 버전 코드 포함됨"
    else
      echo "   ❌ 이전 버전 코드입니다"
    fi
  else
    echo "   ❌ index.html 파일이 없습니다"
  fi
EOF

echo ""
echo "✅ 서버 재시작 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드(인코그니토)로 열기"
echo "3. http://43.200.44.109:3001/invite.html?invite=... 링크로 접속"
echo "4. 개발자 도구(F12) → Network 탭 → 'Disable cache' 체크"
echo "5. 페이지 새로고침 (Ctrl+Shift+R 또는 Cmd+Shift+R)"
echo "6. 콘솔에서 확인: [HTML] Backend API URL set to: http://43.200.44.109:3002"
echo ""