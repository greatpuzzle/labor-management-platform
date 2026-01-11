#!/bin/bash

# Android APK 빌드 스크립트
# 사용법: ./build-apk.sh [debug|release]

set -e

echo "🚀 Android APK 빌드 시작..."

# 빌드 타입 설정 (기본값: release)
BUILD_TYPE=${1:-release}

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 오류: apps/mobile 디렉토리에서 실행해주세요."
    exit 1
fi

echo "📦 1단계: 웹 앱 빌드 중..."
npm run build

echo "🔄 2단계: Capacitor 동기화 중..."
npx cap sync android

echo "🔨 3단계: Android APK 빌드 중..."
cd android

if [ "$BUILD_TYPE" = "debug" ]; then
    echo "   디버그 APK 빌드..."
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    echo "✅ 디버그 APK 빌드 완료!"
    echo "   위치: $APK_PATH"
else
    echo "   릴리즈 APK 빌드..."
    
    # 키스토어 확인
    if [ -f "key.properties" ] && [ -f "app/labor-management-release.keystore" ]; then
        echo "   서명된 APK 빌드..."
        ./gradlew assembleRelease
        
        APK_PATH="app/build/outputs/apk/release/app-release.apk"
        echo "✅ 서명된 릴리즈 APK 빌드 완료!"
    else
        echo "   ⚠️  키스토어가 없어서 서명되지 않은 APK를 빌드합니다."
        echo "   (테스트용으로만 사용 가능)"
        ./gradlew assembleRelease
        
        APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
        echo "✅ 서명되지 않은 릴리즈 APK 빌드 완료!"
    fi
    
    echo "   위치: $APK_PATH"
fi

cd ..

# APK 파일 크기 확인
if [ -f "android/$APK_PATH" ]; then
    APK_SIZE=$(du -h "android/$APK_PATH" | cut -f1)
    echo ""
    echo "📊 APK 정보:"
    echo "   크기: $APK_SIZE"
    echo "   경로: $(pwd)/android/$APK_PATH"
    echo ""
    echo "💡 다음 단계:"
    echo "   1. APK 파일을 Android 기기로 전송"
    echo "   2. 기기에서 '알 수 없는 소스에서 설치 허용' 설정"
    echo "   3. APK 파일을 탭하여 설치"
    echo ""
    echo "   또는 ADB로 직접 설치:"
    echo "   adb install android/$APK_PATH"
else
    echo "❌ APK 파일을 찾을 수 없습니다."
    exit 1
fi

