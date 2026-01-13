#!/bin/bash

# 빌드 및 배포 후 확인 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Admin 웹 배포 및 확인..."
echo ""

# 1. 로컬 빌드 확인
echo "1. 로컬 빌드 확인..."
cd "$LOCAL_DIR/apps/admin"

if [ ! -d "dist" ]; then
  echo "   ❌ dist 폴더가 없습니다. 빌드를 먼저 실행하세요."
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$BUILD_JS" ]; then
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다."
  exit 1
fi

echo "   ✅ 빌드된 파일 확인됨: $BUILD_JS"
echo ""

# 2. 빌드된 파일 내용 확인
echo "2. 빌드된 파일 내용 확인..."

if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드된 파일에 새 코드 포함됨"
else
  echo "   ⚠️  빌드된 파일에 새 코드 없음"
  echo "   다시 빌드하세요: cd apps/admin && rm -rf dist node_modules/.vite && npm run build"
  exit 1
fi

echo ""

# 3. EC2 서버에 배포
echo "3. EC2 서버에 배포 중..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"
echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일: $DEPLOYED_JS"
    echo "   파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
    echo ""
    
    if grep -q "AWS deployment detected\|Production environment detected" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 배포된 파일에 새 코드 포함됨"
      echo ""
      echo "   샘플 (압축되어 읽기 어려움):"
      grep -o "AWS deployment detected[^\"']*\|Production environment detected[^\"']*" "$DEPLOYED_JS" 2>/dev/null | head -1
    else
      echo "   ❌ 배포된 파일에 새 코드 없음"
      echo "   ⚠️  배포가 제대로 되지 않았습니다."
    fi
    
    if grep -q "Using hostname-based URL" "$DEPLOYED_JS" 2>/dev/null; then
      echo ""
      echo "   ⚠️  배포된 파일에 이전 버전 로그 포함됨 (문제 가능성)"
    fi
  else
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 배포 및 확인 완료!"
echo ""
echo "📋 중요: 브라우저 캐시 완전 삭제 필요!"
echo ""
echo "1. 브라우저 완전히 닫기 (모든 탭)"
echo "2. 시크릿 모드로 접속 (권장):"
echo "   - Chrome: Ctrl+Shift+N (Windows) 또는 Cmd+Shift+N (Mac)"
echo "   - 주소: http://43.200.44.109:3000"
echo ""
echo "3. 또는 브라우저 캐시 완전 삭제:"
echo "   - Chrome: 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제"
echo "   - 캐시된 이미지 및 파일 체크 > 삭제"
echo ""
echo "4. 개발자 도구(F12) > Network 탭 > 'Disable cache' 체크"
echo "5. 페이지 새로고침"
echo "6. 콘솔 확인:"
echo "   - [API Client] AWS deployment detected, using port 3002"
echo "   - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo ""
