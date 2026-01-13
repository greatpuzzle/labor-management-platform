#!/bin/bash

# 모바일 앱 강제 재배포 스크립트 V2 (완전 삭제 + 캐시 버스팅)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 모바일 앱 강제 재배포 V2 (완전 삭제 + 캐시 버스팅)..."
echo ""

# 1. 로컬 빌드
echo "1. 로컬 빌드 중..."
cd "$LOCAL_DIR/apps/mobile"

# 기존 빌드 완전 삭제
rm -rf dist node_modules/.vite

# 빌드 실행
echo "   빌드 실행 중..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  echo "   ❌ 빌드 실패!"
  exit 1
fi

# 빌드된 파일 확인
if grep -q "43.200.44.109.*3002\|hostname === '43.200.44.109'" dist/index.html 2>/dev/null; then
  echo "   ✅ 빌드 성공 - 새 코드 포함됨"
else
  echo "   ❌ 빌드 파일에 새 코드 없음"
  exit 1
fi

echo ""

# 2. 서버에서 기존 파일 완전 삭제
echo "2. 서버에서 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -d "/home/ubuntu/app/mobile" ]; then
    echo "   기존 파일 삭제 중..."
    rm -rf /home/ubuntu/app/mobile/*
    rm -rf /home/ubuntu/app/mobile/.* 2>/dev/null || true
    echo "   ✅ 기존 파일 삭제 완료"
  else
    mkdir -p /home/ubuntu/app/mobile
    echo "   ✅ 디렉토리 생성 완료"
  fi
EOF

echo ""

# 3. 새 파일 업로드
echo "3. 새 파일 업로드..."
scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/mobile/dist/"* "$EC2_HOST:~/app/mobile/" 2>&1 | tail -5
echo "   ✅ 파일 업로드 완료"

echo ""

# 4. 서버 파일 확인
echo "4. 서버 파일 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ 배포된 index.html 확인됨"
    echo ""
    echo "   === index.html 내용 (API URL 설정 부분) ==="
    grep -A 15 "백엔드 API URL" /home/ubuntu/app/mobile/index.html | head -20
    echo ""
    
    if grep -q "hostname === '43.200.44.109'" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ AWS 환경 체크 코드 포함됨"
    else
      echo "   ❌ AWS 환경 체크 코드 없음"
    fi
    
    if grep -q "3002" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ 포트 3002 설정 포함됨"
    else
      echo "   ❌ 포트 3002 설정 없음"
    fi
    
    if grep -q "192.168.45.219:3000" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ❌ 이전 버전 코드 포함됨 (문제!)"
    else
      echo "   ✅ 이전 버전 코드 없음"
    fi
  else
    echo "   ❌ 배포된 index.html을 찾을 수 없습니다"
  fi
EOF

echo ""

# 5. PM2 재시작
echo "5. PM2 재시작..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" "pm2 restart mobile-app || pm2 start mobile-app"

echo ""
echo "✅ 강제 재배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드(인코그니토)에서 접속"
echo "3. 초대 링크로 접속: http://43.200.44.109:3001/invite.html?invite=..."
echo "4. 콘솔에서 확인: [HTML] Backend API URL set to: http://43.200.44.109:3002"
echo "5. 만약 여전히 문제가 있으면:"
echo "   - Chrome 개발자 도구 → Application → Clear storage → Clear site data"
echo "   - Service Workers → Unregister"
echo ""
