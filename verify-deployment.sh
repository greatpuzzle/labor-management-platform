#!/bin/bash

# 배포된 파일 확인 및 재배포

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 배포된 파일 확인 및 재배포..."
echo ""

# 1. 로컬 코드 확인
echo "1. 로컬 코드 확인:"
LOCAL_CODE=$(grep -A 5 "AWS EC2 배포 환경" "$LOCAL_DIR/packages/shared/api.ts" | head -3)
if echo "$LOCAL_CODE" | grep -q "3002"; then
  echo "   ✅ 로컬 코드에 포트 3002 포함됨"
else
  echo "   ❌ 로컬 코드에 포트 3002 없음"
  exit 1
fi

echo ""

# 2. 로컬 빌드
echo "2. 로컬 빌드..."
cd "$LOCAL_DIR/apps/admin"

if [ -d "dist" ]; then
  echo "   기존 dist 폴더 삭제 중..."
  rm -rf dist
fi

echo "   빌드 중..."
if npm run build 2>&1 | tail -10; then
  echo "   ✅ 빌드 완료"
else
  echo "   ❌ 빌드 실패"
  exit 1
fi

# 3. 빌드된 파일 확인
echo ""
echo "3. 빌드된 파일 확인:"
BUILD_JS=$(find dist/assets -name "index-*.js" | head -1)
if [ -n "$BUILD_JS" ]; then
  echo "   파일: $BUILD_JS"
  if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
    echo "   ✅ 빌드된 파일에 새 코드 포함됨"
  else
    echo "   ❌ 빌드된 파일에 새 코드 없음"
    exit 1
  fi
  
  if grep -q "43.200.44.109.*3002\|hostname.*3002" "$BUILD_JS" 2>/dev/null; then
    echo "   ✅ 빌드된 파일에 포트 3002 포함됨"
  else
    echo "   ⚠️  빌드된 파일에서 포트 3002를 명시적으로 찾을 수 없음 (압축됨)"
  fi
else
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다"
  exit 1
fi

echo ""

# 4. EC2 서버에 배포
echo "4. EC2 서버에 배포 중..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 5. 배포 확인
echo "5. 배포 확인:"
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일: $DEPLOYED_JS"
    echo "   파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
    echo ""
    
    if grep -q "AWS deployment detected\|Production environment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 배포된 파일에 새 코드 포함됨"
      echo "   샘플:"
      grep -o "AWS deployment detected[^\"']*\|Production environment detected[^\"']*" "$DEPLOYED_JS" 2>/dev/null | head -1
    else
      echo "   ❌ 배포된 파일에 새 코드 없음"
      echo "   검색 중..."
      grep -o "Using hostname-based URL[^\"']*" "$DEPLOYED_JS" 2>/dev/null | head -1
    fi
  else
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 재배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. 브라우저 완전히 닫고 다시 열기 (또는 시크릿 모드 사용)"
echo "   2. 하드 리프레시: Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)"
echo "   3. 개발자 도구 > Network 탭 > 'Disable cache' 체크"
echo "   4. 페이지 새로고침"
echo "   5. 콘솔 확인:"
echo "      - [API Client] AWS deployment detected, using port 3002"
echo "      - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo ""
