#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [admin|mobile|all]

set -e

echo "🚀 배포 스크립트 시작..."

# 환경 변수 확인
check_env() {
  local app=$1
  if [ "$app" = "admin" ]; then
    if [ -z "$VITE_API_URL" ] || [ -z "$VITE_MOBILE_APP_URL" ]; then
      echo "⚠️  경고: 환경 변수가 설정되지 않았습니다."
      echo "   어드민 웹에는 다음 환경 변수가 필요합니다:"
      echo "   - VITE_API_URL"
      echo "   - VITE_MOBILE_APP_URL"
      echo ""
      echo "   .env 파일을 생성하거나 환경 변수를 설정해주세요."
      read -p "계속하시겠습니까? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  elif [ "$app" = "mobile" ]; then
    if [ -z "$VITE_API_URL" ]; then
      echo "⚠️  경고: 환경 변수가 설정되지 않았습니다."
      echo "   모바일 앱에는 다음 환경 변수가 필요합니다:"
      echo "   - VITE_API_URL"
      echo ""
      echo "   .env 파일을 생성하거나 환경 변수를 설정해주세요."
      read -p "계속하시겠습니까? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  fi
}

build_admin() {
  echo "📦 어드민 웹 빌드 중..."
  cd apps/admin
  npm run build
  echo "✅ 어드민 웹 빌드 완료: apps/admin/dist/"
  cd ../..
}

build_mobile() {
  echo "📦 모바일 앱 빌드 중..."
  cd apps/mobile
  npm run build
  echo "✅ 모바일 앱 빌드 완료: apps/mobile/dist/"
  cd ../..
}

# 인자 확인
TARGET=${1:-all}

case $TARGET in
  admin)
    check_env admin
    build_admin
    ;;
  mobile)
    check_env mobile
    build_mobile
    ;;
  all)
    check_env admin
    check_env mobile
    build_admin
    build_mobile
    echo ""
    echo "🎉 전체 빌드 완료!"
    echo ""
    echo "다음 단계:"
    echo "1. apps/admin/dist/ 폴더를 어드민 웹 호스팅 서비스에 업로드"
    echo "2. apps/mobile/dist/ 폴더를 모바일 앱 호스팅 서비스에 업로드"
    ;;
  *)
    echo "❌ 잘못된 인자입니다."
    echo "사용법: ./deploy.sh [admin|mobile|all]"
    exit 1
    ;;
esac

