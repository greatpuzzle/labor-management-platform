#!/bin/bash

# 서버의 실제 파일 확인 스크립트
# 어드민 디렉토리의 모든 파일과 내용을 확인

echo "=== 서버의 실제 파일 확인 ==="
echo ""

SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
SERVER_USER="ubuntu"
SERVER_HOST="43.200.44.109"
EC2_HOST="${SERVER_USER}@${SERVER_HOST}"
ADMIN_DIR="/home/ubuntu/app/admin"

echo "1. 서버의 HTML 파일 내용:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "cat ${ADMIN_DIR}/index.html" 2>/dev/null || echo "❌ HTML 파일을 읽을 수 없습니다"
echo ""
echo ""

echo "2. 서버의 assets 디렉토리 파일 목록:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah ${ADMIN_DIR}/assets/ 2>/dev/null | grep -E '\.js$|\.css$'" || echo "❌ assets 디렉토리를 읽을 수 없습니다"
echo ""
echo ""

echo "3. 서버의 index-BzTK-1c7.js 파일 존재 여부:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah ${ADMIN_DIR}/assets/index-BzTK-1c7.js 2>/dev/null" && echo "⚠️ 이전 파일이 여전히 존재합니다!" || echo "✅ 이전 파일이 존재하지 않습니다"
echo ""
echo ""

echo "4. 서버의 index-DR49-q9s.js 파일 존재 여부:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah ${ADMIN_DIR}/assets/index-DR49-q9s.js 2>/dev/null" && echo "✅ 새 파일이 존재합니다" || echo "❌ 새 파일이 존재하지 않습니다"
echo ""
echo ""

echo "5. 서버의 index-DR49-q9s.js 파일 내용 (API URL 관련 부분):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "grep -o 'Using.*URL.*43.200.44.109' ${ADMIN_DIR}/assets/index-DR49-q9s.js 2>/dev/null | head -5" || echo "❌ 파일 내용을 읽을 수 없습니다"
echo ""
echo ""

echo "6. 서버의 index-DR49-q9s.js 파일 내용 (포트 3002 관련 부분):"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "grep -o ':3002' ${ADMIN_DIR}/assets/index-DR49-q9s.js 2>/dev/null | head -5" && echo "✅ 포트 3002가 포함되어 있습니다" || echo "❌ 포트 3002가 포함되어 있지 않습니다"
echo ""
