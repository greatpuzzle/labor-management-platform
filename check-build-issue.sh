#!/bin/bash

# 빌드 문제 확인 스크립트

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 빌드 문제 확인..."
echo ""

# 1. 로컬 소스 코드 확인
echo "1. 로컬 소스 코드 확인 (packages/shared/api.ts):"
cd "$LOCAL_DIR"

if grep -q "Using hostname-based URL" packages/shared/api.ts 2>/dev/null; then
  echo "   ❌ 로컬 코드에 'Using hostname-based URL' 포함됨 (문제!)"
  grep -n "Using hostname-based URL" packages/shared/api.ts
else
  echo "   ✅ 로컬 코드에 'Using hostname-based URL' 없음 (정상)"
fi

if grep -q "AWS deployment detected" packages/shared/api.ts 2>/dev/null; then
  echo "   ✅ 로컬 코드에 'AWS deployment detected' 포함됨"
else
  echo "   ❌ 로컬 코드에 'AWS deployment detected' 없음"
fi

echo ""

# 2. 빌드된 파일 확인
echo "2. 빌드된 파일 확인 (apps/admin/dist):"
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

echo "   빌드된 파일: $BUILD_JS"
echo "   파일 크기: $(ls -lh "$BUILD_JS" | awk '{print $5}')"
echo "   수정 시간: $(ls -l "$BUILD_JS" | awk '{print $6, $7, $8}')"
echo ""

# 3. 빌드된 파일 내용 확인
echo "3. 빌드된 파일 내용 확인:"

if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드된 파일에 'Using hostname-based URL' 포함됨 (문제!)"
  echo "   샘플:"
  grep -o "Using hostname-based URL[^\"']*" "$BUILD_JS" 2>/dev/null | head -1
  echo ""
  echo "   ⚠️  빌드가 제대로 되지 않았습니다!"
  echo "   가능한 원인:"
  echo "   1. packages/shared가 제대로 빌드에 포함되지 않음"
  echo "   2. Vite 캐시 문제"
  echo "   3. 다른 곳에서 이전 버전 코드를 참조"
else
  echo "   ✅ 빌드된 파일에 'Using hostname-based URL' 없음 (정상)"
fi

if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드된 파일에 새 코드 포함됨"
  echo "   샘플:"
  grep -o "AWS deployment detected[^\"']*\|Production environment detected[^\"']*" "$BUILD_JS" 2>/dev/null | head -1
else
  echo "   ❌ 빌드된 파일에 새 코드 없음"
fi

echo ""
echo "✅ 확인 완료"
echo ""
echo "📋 다음 단계:"
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ❌ 빌드에 문제가 있습니다."
  echo ""
  echo "   해결 방법:"
  echo "   1. Vite 캐시 완전 삭제:"
  echo "      cd apps/admin"
  echo "      rm -rf dist node_modules/.vite .vite"
  echo "   2. 루트 node_modules/.vite도 삭제:"
  echo "      cd ../.."
  echo "      rm -rf node_modules/.vite"
  echo "   3. 재빌드:"
  echo "      cd apps/admin"
  echo "      npm run build"
  echo "   4. 다시 확인:"
  echo "      cd ../.."
  echo "      ./check-build-issue.sh"
else
  echo "   ✅ 빌드가 올바르게 되었습니다."
  echo "   EC2 서버에 배포하세요:"
  echo "   ./deploy-and-verify.sh"
fi
