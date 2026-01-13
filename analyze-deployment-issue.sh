#!/bin/bash

# 배포 문제 분석 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 배포 문제 분석..."
echo ""

# 1. 로컬 빌드 확인
echo "1. 로컬 빌드 확인..."
cd "$LOCAL_DIR/apps/admin"

if [ ! -d "dist" ]; then
  echo "   ❌ dist 폴더가 없습니다."
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$BUILD_JS" ]; then
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다."
  exit 1
fi

BUILD_JS_NAME=$(basename "$BUILD_JS")
BUILD_JS_SIZE=$(ls -lh "$BUILD_JS" | awk '{print $5}')
BUILD_JS_TIME=$(ls -l "$BUILD_JS" | awk '{print $6, $7, $8}')

echo "   로컬 빌드된 파일: $BUILD_JS_NAME"
echo "   파일 크기: $BUILD_JS_SIZE"
echo "   수정 시간: $BUILD_JS_TIME"
echo ""

# 2. 로컬 빌드 내용 확인
echo "2. 로컬 빌드 내용 확인:"
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 로컬 빌드에 이전 버전 로그 포함됨"
else
  echo "   ✅ 로컬 빌드에 이전 버전 로그 없음"
fi

if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 로컬 빌드에 새 코드 포함됨"
else
  echo "   ❌ 로컬 빌드에 새 코드 없음"
fi

echo ""

# 3. EC2 서버의 배포된 파일 확인
echo "3. EC2 서버의 배포된 파일 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << EOF
  DEPLOYED_JS=\$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  
  if [ -z "\$DEPLOYED_JS" ]; then
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다."
    exit 1
  fi
  
  DEPLOYED_JS_NAME=\$(basename "\$DEPLOYED_JS")
  DEPLOYED_JS_SIZE=\$(ls -lh "\$DEPLOYED_JS" | awk '{print \$5}')
  DEPLOYED_JS_TIME=\$(ls -l "\$DEPLOYED_JS" | awk '{print \$6, \$7, \$8}')
  
  echo "   배포된 파일: \$DEPLOYED_JS_NAME"
  echo "   파일 크기: \$DEPLOYED_JS_SIZE"
  echo "   수정 시간: \$DEPLOYED_JS_TIME"
  echo ""
  
  # 파일명 비교
  if [ "\$DEPLOYED_JS_NAME" != "$BUILD_JS_NAME" ]; then
    echo "   ⚠️  파일명이 다릅니다!"
    echo "   로컬: $BUILD_JS_NAME"
    echo "   배포: \$DEPLOYED_JS_NAME"
    echo "   이것이 문제일 수 있습니다 (브라우저가 이전 파일을 캐시)"
  else
    echo "   ✅ 파일명 동일: \$DEPLOYED_JS_NAME"
  fi
  
  # 파일 크기 비교
  if [ "\$DEPLOYED_JS_SIZE" != "$BUILD_JS_SIZE" ]; then
    echo "   ⚠️  파일 크기가 다릅니다!"
    echo "   로컬: $BUILD_JS_SIZE"
    echo "   배포: \$DEPLOYED_JS_SIZE"
  else
    echo "   ✅ 파일 크기 동일: \$DEPLOYED_JS_SIZE"
  fi
  
  echo ""
  
  # 배포된 파일 내용 확인
  echo "4. 배포된 파일 내용 확인:"
  if grep -q "Using hostname-based URL" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ❌ 배포된 파일에 이전 버전 로그 포함됨"
    echo "   이것이 문제입니다!"
  else
    echo "   ✅ 배포된 파일에 이전 버전 로그 없음"
  fi
  
  if grep -q "AWS deployment detected\|Production environment detected" "\$DEPLOYED_JS" 2>/dev/null; then
    echo "   ✅ 배포된 파일에 새 코드 포함됨"
  else
    echo "   ❌ 배포된 파일에 새 코드 없음"
    echo "   이것이 문제입니다!"
  fi
  
  echo ""
  
  # 모든 JavaScript 파일 확인
  echo "5. 모든 JavaScript 파일 확인:"
  echo "   배포된 JavaScript 파일 목록:"
  ls -lth /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -5 || echo "   파일 없음"
  
  echo ""
  
  # 포트 3000 사용 프로세스 확인
  echo "6. 포트 3000 사용 프로세스 확인:"
  PID=\$(sudo lsof -ti :3000 2>/dev/null | head -1)
  if [ -n "\$PID" ]; then
    echo "   프로세스 ID: \$PID"
    ps aux | grep \$PID | grep -v grep | head -1
    echo "   프로세스 경로:"
    sudo ls -l /proc/\$PID/exe 2>/dev/null || echo "   확인 불가"
  else
    echo "   포트 3000 사용 프로세스 없음"
  fi
EOF

echo ""
echo "✅ 분석 완료"
echo ""
echo "📋 분석 결과:"
echo "   - 파일명이 다르면: 브라우저가 이전 파일을 캐시하고 있을 수 있습니다"
echo "   - 파일 크기가 다르면: 배포가 제대로 안 되었을 수 있습니다"
echo "   - 배포된 파일에 이전 버전 로그가 있으면: 배포된 파일이 이전 버전입니다"
echo "   - 배포된 파일에 새 코드가 없으면: 배포가 제대로 안 되었습니다"
