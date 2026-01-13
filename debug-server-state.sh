#!/bin/bash

# 서버 상태 디버깅 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"

echo "=== 서버 상태 디버깅 ==="
echo ""

echo "1. 서버의 admin 디렉토리 전체 구조:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -la /home/ubuntu/app/admin/ 2>/dev/null" || echo "❌ 디렉토리를 읽을 수 없습니다"
echo ""
echo ""

echo "2. 서버의 assets 디렉토리 모든 파일:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah /home/ubuntu/app/admin/assets/ 2>/dev/null" || echo "❌ assets 디렉토리를 읽을 수 없습니다"
echo ""
echo ""

echo "3. 서버의 index.html 파일 전체 내용:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "cat /home/ubuntu/app/admin/index.html 2>/dev/null" || echo "❌ HTML 파일을 읽을 수 없습니다"
echo ""
echo ""

echo "4. 서버의 index-BzTK-1c7.js 파일 존재 여부:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah /home/ubuntu/app/admin/assets/index-BzTK-1c7.js 2>/dev/null && echo '⚠️ 이전 파일이 여전히 존재합니다!' || echo '✅ 이전 파일이 존재하지 않습니다'"
echo ""
echo ""

echo "5. 서버의 모든 index-*.js 파일:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null" || echo "❌ JavaScript 파일을 찾을 수 없습니다"
echo ""
echo ""

echo "6. 서버의 index-DR49-q9s.js 파일 존재 및 내용 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/admin/assets/index-DR49-q9s.js" ]; then
    echo "✅ 파일 존재"
    echo "파일 크기: $(ls -lh /home/ubuntu/app/admin/assets/index-DR49-q9s.js | awk '{print $5}')"
    echo "수정 시간: $(ls -l /home/ubuntu/app/admin/assets/index-DR49-q9s.js | awk '{print $6, $7, $8}')"
    echo ""
    echo "코드 내용 확인 (AWS deployment):"
    grep -o "AWS deployment detected" /home/ubuntu/app/admin/assets/index-DR49-q9s.js 2>/dev/null | head -1 && echo "✅ 새 코드 포함" || echo "❌ 새 코드 없음"
    echo ""
    echo "코드 내용 확인 (포트 3002):"
    grep -o ":3002" /home/ubuntu/app/admin/assets/index-DR49-q9s.js 2>/dev/null | head -1 && echo "✅ 포트 3002 포함" || echo "❌ 포트 3002 없음"
    echo ""
    echo "코드 내용 확인 (이전 로그):"
    grep -o "Using hostname-based URL" /home/ubuntu/app/admin/assets/index-DR49-q9s.js 2>/dev/null | head -1 && echo "⚠️ 이전 로그 포함" || echo "✅ 이전 로그 없음"
  else
    echo "❌ 파일이 존재하지 않습니다"
  fi
EOF

echo ""
echo ""

echo "7. 서버의 PM2 프로세스 상태 (admin-page):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 list | grep admin-page" || echo "admin-page 프로세스를 찾을 수 없습니다"
echo ""
echo ""

echo "8. 서버의 포트 3000 사용 프로세스:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "sudo lsof -i :3000 2>/dev/null | head -5" || echo "포트 3000 사용 프로세스를 찾을 수 없습니다"
echo ""
