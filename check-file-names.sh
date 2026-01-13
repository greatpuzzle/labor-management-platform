#!/bin/bash

# 파일명 불일치 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 파일명 불일치 확인..."
echo ""

# 1. 로컬 빌드 확인
echo "1. 로컬 빌드 확인..."
cd "$LOCAL_DIR/apps/admin"

if [ ! -d "dist" ]; then
  echo "   ❌ dist 폴더가 없습니다. 빌드를 먼저 실행하세요."
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
BUILD_JS_NAME=$(basename "$BUILD_JS" 2>/dev/null)
BUILD_HTML=$(find dist -name "index.html" 2>/dev/null | head -1)

if [ -z "$BUILD_JS" ]; then
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다."
  exit 1
fi

echo "   로컬 빌드된 JavaScript 파일: $BUILD_JS_NAME"
echo "   파일 크기: $(ls -lh "$BUILD_JS" | awk '{print $5}')"
echo ""

# 2. HTML 파일 확인
echo "2. 로컬 HTML 파일 확인..."
if [ -f "$BUILD_HTML" ]; then
  echo "   HTML 파일이 참조하는 JavaScript:"
  grep -o 'index-[^"]*\.js' "$BUILD_HTML" 2>/dev/null | head -3
  echo ""
  
  HTML_REF=$(grep -o 'index-[^"]*\.js' "$BUILD_HTML" 2>/dev/null | head -1)
  if [ "$HTML_REF" != "$BUILD_JS_NAME" ]; then
    echo "   ⚠️  HTML 파일과 JavaScript 파일명 불일치!"
    echo "   HTML 참조: $HTML_REF"
    echo "   실제 파일: $BUILD_JS_NAME"
  else
    echo "   ✅ HTML 파일과 JavaScript 파일명 일치"
  fi
else
  echo "   ❌ HTML 파일을 찾을 수 없습니다."
fi

echo ""

# 3. EC2 서버의 배포된 파일 확인
echo "3. EC2 서버의 배포된 파일 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  DEPLOYED_JS=\$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  DEPLOYED_JS_NAME=\$(basename "\$DEPLOYED_JS" 2>/dev/null)
  DEPLOYED_HTML="/home/ubuntu/app/admin/index.html"
  
  if [ -z "\$DEPLOYED_JS" ]; then
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다."
    exit 1
  fi
  
  echo "   배포된 JavaScript 파일: \$DEPLOYED_JS_NAME"
  echo "   파일 크기: \$(ls -lh "\$DEPLOYED_JS" | awk '{print \$5}')"
  echo ""
  
  # 파일명 비교
  if [ "\$DEPLOYED_JS_NAME" != "$BUILD_JS_NAME" ]; then
    echo "   ❌ 파일명이 다릅니다!"
    echo "   로컬: $BUILD_JS_NAME"
    echo "   배포: \$DEPLOYED_JS_NAME"
    echo "   이것이 문제입니다!"
  else
    echo "   ✅ 파일명 일치: \$DEPLOYED_JS_NAME"
  fi
  
  echo ""
  
  # HTML 파일 확인
  echo "4. 배포된 HTML 파일 확인..."
  if [ -f "\$DEPLOYED_HTML" ]; then
    echo "   HTML 파일이 참조하는 JavaScript:"
    grep -o 'index-[^"]*\.js' "\$DEPLOYED_HTML" 2>/dev/null | head -3
    echo ""
    
    HTML_REF=\$(grep -o 'index-[^"]*\.js' "\$DEPLOYED_HTML" 2>/dev/null | head -1)
    if [ "\$HTML_REF" != "\$DEPLOYED_JS_NAME" ]; then
      echo "   ⚠️  HTML 파일과 JavaScript 파일명 불일치!"
      echo "   HTML 참조: \$HTML_REF"
      echo "   실제 파일: \$DEPLOYED_JS_NAME"
    else
      echo "   ✅ HTML 파일과 JavaScript 파일명 일치"
    fi
  else
    echo "   ❌ 배포된 HTML 파일을 찾을 수 없습니다."
  fi
  
  echo ""
  
  # 모든 JavaScript 파일 확인
  echo "5. 모든 배포된 JavaScript 파일 확인:"
  echo "   배포된 JavaScript 파일 목록:"
  ls -lh /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | awk '{print \$9, \$5}' | head -5
  
  echo ""
  echo "   ⚠️  여러 개의 JavaScript 파일이 있을 수 있습니다!"
  echo "   이전 파일이 남아있을 수 있습니다."
EOF

echo ""
echo "✅ 확인 완료"
echo ""
echo "📋 문제 분석:"
echo "   파일명이 다르면:"
echo "   1. 배포가 제대로 안 되었거나"
echo "   2. 이전 빌드 파일이 남아있을 수 있습니다"
echo ""
echo "   해결 방법:"
echo "   ./fix-deployment-complete.sh"
echo "   (기존 파일을 완전히 삭제한 후 재배포)"
