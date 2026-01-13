#!/bin/bash

# 로컬 빌드 파일과 서버 파일 비교 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 로컬 빌드 파일 vs 서버 파일 비교 ==="
echo ""

# 1. 로컬 빌드 파일 확인
echo "1. 로컬 빌드 파일 확인:"
LOCAL_JS=$(find "$LOCAL_DIR/apps/admin/dist/assets" -name "index-*.js" 2>/dev/null | head -1)

if [ -z "$LOCAL_JS" ]; then
  echo "   ❌ 로컬 빌드 파일을 찾을 수 없습니다. 먼저 빌드하세요."
  exit 1
fi

LOCAL_JS_NAME=$(basename "$LOCAL_JS")
echo "   파일명: $LOCAL_JS_NAME"
echo "   파일 크기: $(ls -lh "$LOCAL_JS" | awk '{print $5}')"
echo ""

echo "   코드 내용 확인:"
if grep -q "Using hostname-based URL" "$LOCAL_JS" 2>/dev/null; then
  echo "   ❌ 로컬 빌드에 이전 로그 포함됨!"
  echo "   위치: $(grep -n 'Using hostname-based URL' "$LOCAL_JS" | head -1 | cut -d: -f1)"
else
  echo "   ✅ 로컬 빌드에 이전 로그 없음"
fi

if grep -q "AWS deployment detected\|Production environment detected" "$LOCAL_JS" 2>/dev/null; then
  echo "   ✅ 로컬 빌드에 새 코드 포함됨"
else
  echo "   ❌ 로컬 빌드에 새 코드 없음"
fi

echo ""
echo ""

# 2. 서버 파일 확인
echo "2. 서버 파일 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  SERVER_JS=\$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  
  if [ -z "\$SERVER_JS" ]; then
    echo "   ❌ 서버에 JavaScript 파일을 찾을 수 없습니다"
    exit 1
  fi
  
  SERVER_JS_NAME=\$(basename "\$SERVER_JS")
  echo "   파일명: \$SERVER_JS_NAME"
  echo "   파일 크기: \$(ls -lh "\$SERVER_JS" | awk '{print \$5}')"
  echo ""
  
  echo "   코드 내용 확인:"
  if grep -q "Using hostname-based URL" "\$SERVER_JS" 2>/dev/null; then
    echo "   ❌ 서버 파일에 이전 로그 포함됨!"
    echo "   위치: \$(grep -n 'Using hostname-based URL' "\$SERVER_JS" | head -1 | cut -d: -f1)"
  else
    echo "   ✅ 서버 파일에 이전 로그 없음"
  fi
  
  if grep -q "AWS deployment detected\|Production environment detected" "\$SERVER_JS" 2>/dev/null; then
    echo "   ✅ 서버 파일에 새 코드 포함됨"
  else
    echo "   ❌ 서버 파일에 새 코드 없음"
  fi
EOF

echo ""
echo ""

# 3. 파일명 비교
echo "3. 파일명 비교:"
echo "   로컬: $LOCAL_JS_NAME"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  SERVER_JS=\$(ls -t /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  SERVER_JS_NAME=\$(basename "\$SERVER_JS")
  echo "   서버: \$SERVER_JS_NAME"
  echo ""
  
  if [ "\$SERVER_JS_NAME" = "$LOCAL_JS_NAME" ]; then
    echo "   ✅ 파일명 일치"
  else
    echo "   ⚠️  파일명이 다릅니다!"
  fi
EOF

echo ""
echo ""

# 4. 서버의 모든 JavaScript 파일 확인
echo "4. 서버의 모든 index-*.js 파일:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "ls -lah /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null" || echo "❌ 파일을 찾을 수 없습니다"
echo ""
