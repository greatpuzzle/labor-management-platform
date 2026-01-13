#!/bin/bash

# 빌드된 파일 내용 확인 스크립트

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 빌드된 파일 내용 확인..."
echo ""

# 1. 로컬 코드 확인
echo "1. 로컬 코드 확인 (packages/shared/api.ts):"
if grep -q "hostname === '43.200.44.109'" "$LOCAL_DIR/packages/shared/api.ts"; then
  echo "   ✅ 로컬 코드에 43.200.44.109 체크 포함됨"
  echo "   코드 샘플:"
  grep -A 3 "hostname === '43.200.44.109'" "$LOCAL_DIR/packages/shared/api.ts" | head -4
else
  echo "   ❌ 로컬 코드에 43.200.44.109 체크 없음"
  exit 1
fi

echo ""

# 2. Admin 웹 빌드 확인
echo "2. Admin 웹 빌드 확인..."
cd "$LOCAL_DIR/apps/admin"

if [ ! -d "dist" ]; then
  echo "   ⚠️  dist 폴더가 없습니다. 빌드를 먼저 실행하세요."
  echo "   실행: cd apps/admin && npm run build"
  exit 1
fi

BUILD_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)

if [ -z "$BUILD_JS" ]; then
  echo "   ❌ 빌드된 JavaScript 파일을 찾을 수 없습니다."
  exit 1
fi

echo "   빌드된 파일: $BUILD_JS"
echo "   파일 크기: $(ls -lh "$BUILD_JS" | awk '{print $5}')"
echo ""

# 3. 빌드된 파일 내용 확인
echo "3. 빌드된 파일 내용 확인:"

# 43.200.44.109 검색
if grep -q "43.200.44.109" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드된 파일에 43.200.44.109 포함됨"
  echo "   샘플 (압축되어 읽기 어려움):"
  grep -o "[^,]*43.200.44.109[^,]*" "$BUILD_JS" 2>/dev/null | head -2
else
  echo "   ❌ 빌드된 파일에 43.200.44.109 없음!"
  echo "   ⚠️  빌드가 제대로 되지 않았습니다."
  exit 1
fi

echo ""

# 3002 포트 검색
if grep -q "3002" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드된 파일에 3002 포함됨"
else
  echo "   ⚠️  빌드된 파일에서 3002를 명시적으로 찾을 수 없음 (압축됨)"
fi

echo ""

# AWS deployment detected 검색
if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드된 파일에 새 로그 메시지 포함됨"
  echo "   샘플:"
  grep -o "AWS deployment detected[^\"']*\|Production environment detected[^\"']*" "$BUILD_JS" 2>/dev/null | head -1
else
  echo "   ❌ 빌드된 파일에 새 로그 메시지 없음"
  echo "   ⚠️  빌드가 이전 버전을 사용하고 있을 수 있습니다."
fi

echo ""

# Using hostname-based URL 검색 (이전 버전)
if grep -q "Using hostname-based URL" "$BUILD_JS" 2>/dev/null; then
  echo "   ⚠️  빌드된 파일에 이전 버전 로그 포함됨"
  echo "   이것은 문제일 수 있습니다."
else
  echo "   ✅ 빌드된 파일에 이전 버전 로그 없음"
fi

echo ""
echo "✅ 확인 완료"
echo ""
echo "📋 다음 단계:"
if grep -q "AWS deployment detected\|Production environment detected" "$BUILD_JS" 2>/dev/null; then
  echo "   ✅ 빌드가 올바르게 되었습니다. EC2 서버에 배포하세요."
else
  echo "   ❌ 빌드에 문제가 있습니다. 다음을 시도하세요:"
  echo "   1. cd apps/admin"
  echo "   2. rm -rf dist node_modules/.vite"
  echo "   3. npm run build"
  echo "   4. 이 스크립트를 다시 실행하여 확인"
fi
