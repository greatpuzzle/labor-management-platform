#!/bin/bash

# 최종 강제 재배포 스크립트

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Admin 웹 최종 강제 재배포..."
echo ""

# 1. 로컬 코드 확인
echo "1. 로컬 코드 확인..."
if grep -q "hostname === '43.200.44.109'" "$LOCAL_DIR/packages/shared/api.ts"; then
  echo "   ✅ 로컬 코드에 43.200.44.109 체크 포함됨"
else
  echo "   ❌ 로컬 코드에 43.200.44.109 체크 없음"
  exit 1
fi

# 2. Admin 웹 빌드
echo ""
echo "2. Admin 웹 빌드 (기존 파일 완전 삭제)..."
cd "$LOCAL_DIR/apps/admin"

# 완전히 삭제
rm -rf dist
rm -rf node_modules/.vite

echo "   빌드 중..."
npm run build 2>&1 | tail -15

if [ ! -d "dist" ] || [ -z "$(find dist/assets -name 'index-*.js' 2>/dev/null | head -1)" ]; then
  echo "   ❌ 빌드 실패"
  exit 1
fi

echo "   ✅ 빌드 완료"

# 3. 빌드된 파일 확인
echo ""
echo "3. 빌드된 파일 확인..."
BUILD_JS=$(find dist/assets -name "index-*.js" | head -1)
if [ -n "$BUILD_JS" ]; then
  if grep -q "43.200.44.109" "$BUILD_JS" 2>/dev/null; then
    echo "   ✅ 빌드된 파일에 43.200.44.109 포함됨"
  else
    echo "   ⚠️  빌드된 파일에서 43.200.44.109를 찾을 수 없음 (압축됨)"
  fi
fi

# 4. EC2 서버에 배포
echo ""
echo "4. EC2 서버에 배포 중..."
echo "   기존 파일 백업 및 새 파일 업로드..."

ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "mkdir -p /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S) && cp -r /home/ubuntu/app/admin/* /home/ubuntu/app/admin-backup-$(date +%Y%m%d%H%M%S)/ 2>/dev/null || true"

scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/admin/dist/"* "$EC2_HOST:~/app/admin/" 2>&1 | tail -5

echo "   ✅ 배포 완료"

# 5. 배포 확인
echo ""
echo "5. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  DEPLOYED_JS=$(ls /home/ubuntu/app/admin/assets/index-*.js 2>/dev/null | head -1)
  if [ -n "$DEPLOYED_JS" ]; then
    echo "   배포된 파일: $DEPLOYED_JS"
    echo "   파일 크기: $(ls -lh "$DEPLOYED_JS" | awk '{print $5}')"
    echo "   수정 시간: $(ls -l "$DEPLOYED_JS" | awk '{print $6, $7, $8}')"
    echo ""
    
    if grep -q "43.200.44.109" "$DEPLOYED_JS" 2>/dev/null; then
      echo "   ✅ 배포된 파일에 43.200.44.109 포함됨"
      
      # 3002 포트 확인
      if grep -q "3002" "$DEPLOYED_JS" 2>/dev/null; then
        echo "   ✅ 배포된 파일에 3002 포함됨"
      else
        echo "   ⚠️  배포된 파일에서 3002를 명시적으로 찾을 수 없음 (압축됨)"
      fi
    else
      echo "   ❌ 배포된 파일에 43.200.44.109 없음"
    fi
  else
    echo "   ❌ 배포된 JavaScript 파일을 찾을 수 없습니다"
  fi
EOF

echo ""
echo "✅ 재배포 완료!"
echo ""
echo "📋 중요: 브라우저 캐시 완전 삭제 필요!"
echo ""
echo "1. 브라우저 완전히 닫기 (모든 탭)"
echo "2. 시크릿 모드로 접속: http://43.200.44.109:3000"
echo "   또는"
echo "   브라우저 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제 > 캐시된 이미지 및 파일 체크 > 삭제"
echo "3. 개발자 도구(F12) > Network 탭 > 'Disable cache' 체크"
echo "4. 페이지 새로고침"
echo "5. 콘솔 확인:"
echo "   - [API Client] AWS deployment detected, using port 3002"
echo "   - [API Client] Using API Base URL: http://43.200.44.109:3002"
echo ""
