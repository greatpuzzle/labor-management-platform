#!/bin/bash

# 모바일 앱 강제 재배포 스크립트 (기존 파일 완전 삭제 후 배포)

EC2_IP="43.200.44.109"
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_HOST="ubuntu@$EC2_IP"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 모바일 앱 강제 재배포 (기존 파일 완전 삭제 후 배포)..."
echo ""

# 1. 로컬 빌드 확인
echo "1. 로컬 빌드 확인..."
cd "$LOCAL_DIR/apps/mobile"

if [ ! -d "dist" ]; then
  echo "   ⚠️  dist 폴더가 없습니다. 빌드를 먼저 실행하세요:"
  echo "      cd apps/mobile && npm run build"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo "   ⚠️  dist/index.html 파일이 없습니다. 빌드를 먼저 실행하세요"
  exit 1
fi

# 빌드된 파일 확인
echo "   로컬 빌드 파일 확인 중..."
if grep -q "hostname === '43.200.44.109'" dist/index.html 2>/dev/null; then
  echo "   ✅ 로컬 빌드 파일에 새 코드 포함됨"
else
  echo "   ❌ 로컬 빌드 파일에 새 코드 없음"
  echo "   다시 빌드하세요: cd apps/mobile && rm -rf dist node_modules/.vite && npm run build"
  exit 1
fi

echo ""
echo "   ✅ 로컬 빌드 확인 완료"
echo ""

# 2. 서버에서 기존 파일 완전 삭제
echo "2. 서버에서 기존 파일 완전 삭제..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -d "/home/ubuntu/app/mobile" ]; then
    # 백업 (선택사항)
    echo "   기존 파일 백업 중..."
    BACKUP_DIR="/home/ubuntu/app/mobile-backup-$(date +%Y%m%d%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r /home/ubuntu/app/mobile/* "$BACKUP_DIR/" 2>/dev/null || true
    echo "   백업 완료: $BACKUP_DIR"
    
    # 완전 삭제
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
if [ -d "$LOCAL_DIR/apps/mobile/dist" ]; then
  scp -i "$SSH_KEY_PATH" -r "$LOCAL_DIR/apps/mobile/dist/"* "$EC2_HOST:~/app/mobile/" 2>&1 | tail -5
  echo "   ✅ 파일 업로드 완료"
else
  echo "   ❌ dist 폴더가 없습니다"
  exit 1
fi

echo ""

# 4. 배포 확인
echo "4. 배포 확인..."
ssh -i "$SSH_KEY_PATH" "$EC2_HOST" << 'EOF'
  if [ -f "/home/ubuntu/app/mobile/index.html" ]; then
    echo "   ✅ 배포된 index.html 확인됨"
    echo "   파일 크기: $(ls -lh /home/ubuntu/app/mobile/index.html | awk '{print $5}')"
    echo "   수정 시간: $(ls -l /home/ubuntu/app/mobile/index.html | awk '{print $6, $7, $8}')"
    echo ""
    
    # API URL 확인
    if grep -q "hostname === '43.200.44.109'" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ API URL 동적 설정 코드 포함됨"
    else
      echo "   ❌ API URL 동적 설정 코드 없음"
    fi
    
    if grep -q "43.200.44.109.*3002\|hostname.*3002" /home/ubuntu/app/mobile/index.html 2>/dev/null; then
      echo "   ✅ API URL이 포트 3002로 설정됨"
    else
      echo "   ⚠️  API URL 설정 확인 필요"
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
echo "✅ 강제 재배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 완전히 닫기"
echo "2. 시크릿 모드(인코그니토)에서 접속"
echo "3. 초대 링크로 접속: http://43.200.44.109:3001/invite.html?invite=..."
echo "4. 콘솔에서 확인: [HTML] Backend API URL set to: http://43.200.44.109:3002"
echo ""