# 앱 재빌드 및 Deep Link 테스트 가이드

## 문제
Release APK를 설치했지만 카카오톡에서 계약서 링크 클릭 시 앱으로 연결되지 않음

## 해결 방법

### 1단계: 최신 코드로 다시 빌드

```bash
cd apps/mobile
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

### 2단계: 기존 앱 삭제 후 새 APK 설치

**중요:** 기존 앱을 완전히 삭제한 후 새 APK를 설치해야 합니다!

1. 핸드폰에서 기존 앱 삭제
2. 새 APK 설치: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

### 3단계: Deep Link 테스트

#### 방법 1: ADB로 직접 테스트
```bash
# Custom scheme 테스트
adb shell am start -W -a android.intent.action.VIEW -d "labor://contract/test123" com.ecospott.labor

# Intent URL 테스트
adb shell am start -W -a android.intent.action.VIEW -d "intent://contract/test123#Intent;scheme=labor;package=com.ecospott.labor;end"
```

#### 방법 2: 카카오톡에서 테스트
1. 카카오톡에서 계약서 링크 전송
2. 링크 클릭
3. 앱이 열리면 → 성공 ✅
4. 앱이 안 열리면 → 콘솔 로그 확인

### 4단계: 콘솔 로그 확인

카카오톡 웹뷰에서 계약서 링크 클릭 시:
- Chrome 개발자 도구 → Console 탭
- 다음 메시지 확인:
  - `[App] Is KakaoTalk: true`
  - `[App] Attempting to open app with deep link: intent://...`
  - `[App] App not installed or failed to open, continuing in webview` (앱이 안 열린 경우)

앱이 열렸을 때:
- 앱 내부 콘솔에서:
  - `[App] App opened with URL: labor://contract/...`
  - `[App] Deep link contract ID: ...`

## 확인 사항

✅ **코드 확인:**
- `@capacitor/app` 플러그인 설치됨
- Deep link 처리 로직 있음
- AndroidManifest.xml에 intent-filter 설정됨

⏳ **필요한 작업:**
- 최신 코드로 다시 빌드
- 기존 앱 삭제 후 새 APK 설치
- 카카오톡에서 테스트

## 문제 해결

### 앱이 안 열리는 경우
1. AndroidManifest.xml 확인 (intent-filter가 올바른지)
2. 앱 패키지 이름 확인 (`com.ecospott.labor`)
3. 앱이 실제로 설치되어 있는지 확인

### 앱이 열리지만 계약서가 안 나오는 경우
1. 앱 콘솔 로그 확인
2. Deep link URL 파싱 확인
3. `loadContractAndShow` 함수 확인
