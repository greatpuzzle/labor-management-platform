# Android APK 빌드 및 테스트 준비 완료 ✅

## 📦 생성된 파일

다음 파일들이 `apps/mobile/` 디렉토리에 생성되었습니다:

1. **`BUILD_APK.md`** - 상세한 APK 빌드 가이드 (키스토어, 서명 등)
2. **`QUICK_START_APK.md`** - 빠른 시작 가이드 (3단계)
3. **`README_APK_BUILD.md`** - 전체 가이드 요약
4. **`build-apk.sh`** - 자동화된 빌드 스크립트 (실행 가능)

## 🚀 APK 빌드 방법

### 방법 1: 스크립트 사용 (가장 쉬움)

```bash
cd apps/mobile
./build-apk.sh
```

디버그 APK (테스트용):
```bash
./build-apk.sh debug
```

### 방법 2: npm 스크립트 사용

```bash
cd apps/mobile

# 1. 웹 앱 빌드 및 동기화
npm run android:build

# 2. APK 빌드
cd android
./gradlew assembleRelease
```

디버그 APK:
```bash
./gradlew assembleDebug
```

## 📱 APK 설치 방법

### 방법 1: ADB 사용 (가장 빠름)

```bash
# Android 기기 연결 (USB 디버깅 활성화)
adb devices

# APK 설치
adb install apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 방법 2: 파일 전송

1. APK 파일 찾기:
   - Release: `apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`
   - Debug: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

2. APK 파일을 Android 기기로 전송 (이메일, 클라우드 등)

3. 기기에서:
   - 파일 관리자에서 APK 파일 찾기
   - "알 수 없는 소스에서 설치 허용" 설정
   - APK 파일 탭하여 설치

## 🧪 테스트 시나리오

### 시나리오 1: 로컬에서 APK 다운로드 테스트

1. **APK 파일을 public 폴더에 복사**
   ```bash
   cd apps/mobile
   mkdir -p public/downloads
   cp android/app/build/outputs/apk/release/app-release-unsigned.apk public/downloads/labor-management.apk
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```

3. **테스트**
   - 브라우저에서 `http://localhost:5174/download.html?redirect=/contract/test` 접속
   - Android 기기에서 APK 다운로드 버튼 확인
   - APK 다운로드 및 설치 테스트

### 시나리오 2: 실제 계약서 링크 테스트

1. **APK 파일을 웹 서버에 업로드**
   - 예: `https://your-domain.com/downloads/labor-management.apk`

2. **download.html 메타 태그 업데이트**
   - `apps/mobile/public/download.html` 파일 열기
   - 다음 줄 수정:
   ```html
   <meta name="android-apk-url" content="https://your-domain.com/downloads/labor-management.apk">
   ```

3. **테스트**
   - 카카오톡에서 계약서 링크 클릭
   - 설치 페이지로 자동 리다이렉트 확인
   - APK 다운로드 버튼 클릭
   - APK 설치 확인

## 📋 체크리스트

### 빌드 전
- [ ] Android Studio 설치 확인
- [ ] Android SDK 설치 확인
- [ ] `npm install` 실행 완료

### 빌드
- [ ] `npm run android:build` 성공
- [ ] APK 파일 생성 확인

### 설치
- [ ] APK 파일을 기기로 전송
- [ ] 기기에서 설치 성공
- [ ] 앱 실행 확인

### 테스트
- [ ] 앱에서 계약서 링크 접속 테스트
- [ ] 설치 페이지 리다이렉트 확인
- [ ] APK 다운로드 링크 작동 확인

## 🔧 문제 해결

### Android Studio가 없는 경우

**macOS:**
```bash
# Homebrew로 설치
brew install --cask android-studio
```

**또는 수동 설치:**
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 후 Android SDK 설치

### Gradle 빌드 오류

```bash
cd apps/mobile/android
./gradlew clean
cd ..
npm run android:build
```

### APK 설치 오류

**"앱이 설치되지 않았습니다":**
```bash
# 이전 버전 제거
adb uninstall com.ecospott.labor

# 재설치
adb install apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**"알 수 없는 소스에서 설치 허용":**
- Android 8.0 이상: 설정 > 앱 > 특별 액세스 > 알 수 없는 앱 설치
- Android 7.0 이하: 설정 > 보안 > 알 수 없는 소스

## 📚 문서 가이드

- **빠른 시작**: `apps/mobile/QUICK_START_APK.md`
- **상세 가이드**: `apps/mobile/BUILD_APK.md`
- **전체 가이드**: `apps/mobile/README_APK_BUILD.md`
- **Capacitor 가이드**: `apps/mobile/CAPACITOR.md`
- **앱 설치 설정**: `CAPACITOR_APP_INSTALL.md`

## 🎯 다음 단계

1. ✅ APK 빌드 스크립트 준비 완료
2. ✅ 빌드 가이드 문서 작성 완료
3. ⏭️ 실제 APK 빌드 실행
4. ⏭️ 테스트 기기에서 설치 확인
5. ⏭️ 웹 서버에 APK 업로드
6. ⏭️ download.html 링크 설정
7. ⏭️ 실제 계약서 링크에서 설치 테스트

## 💡 팁

- **테스트용**: 디버그 APK 사용 (`./build-apk.sh debug`)
- **배포용**: 서명된 릴리즈 APK 사용 (키스토어 필요)
- **빠른 테스트**: ADB 사용 (`adb install`)
- **원격 테스트**: 웹 서버에 APK 호스팅

## 🚨 중요 사항

1. **키스토어**: 배포용 APK는 반드시 키스토어로 서명해야 합니다.
2. **버전 관리**: APK 업데이트 시 `versionCode`를 증가시켜야 합니다.
3. **테스트**: 실제 기기에서 충분히 테스트한 후 배포하세요.

---

**준비 완료!** 이제 `cd apps/mobile && ./build-apk.sh` 명령어로 APK를 빌드할 수 있습니다! 🎉

