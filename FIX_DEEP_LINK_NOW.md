# Deep Link 문제 해결 가이드

## 현재 상황
Release APK를 설치했지만 카카오톡에서 계약서 링크 클릭 시 앱으로 연결되지 않음

## 해결 단계

### 1단계: 최신 코드로 다시 빌드 (필수!)

```bash
cd apps/mobile
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

**중요:** 코드 변경사항이 APK에 반영되려면 반드시 다시 빌드해야 합니다!

### 2단계: 기존 앱 완전 삭제

**매우 중요:** 기존 앱을 완전히 삭제한 후 새 APK를 설치해야 합니다!

1. 핸드폰 설정 → 앱 → 근로자 관리 → 삭제
2. 또는 앱 아이콘 길게 누르기 → 삭제

### 3단계: 새 APK 설치

```bash
adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

또는 APK 파일을 직접 전송하여 설치

### 4단계: Deep Link 테스트

#### ADB로 직접 테스트 (빠른 확인)
```bash
adb shell am start -W -a android.intent.action.VIEW -d "labor://contract/test123" com.ecospott.labor
```

앱이 열리면 → Deep Link 작동 ✅

#### 카카오톡에서 테스트
1. 카카오톡에서 계약서 링크 전송
2. 링크 클릭
3. 앱이 열리면 → 성공 ✅

### 5단계: 콘솔 로그 확인

카카오톡 웹뷰에서:
- Chrome 개발자 도구 → Console
- `[App] Attempting to open app with deep link: intent://...` 메시지 확인

앱이 열렸을 때:
- 앱 내부 로그캣 또는 Chrome DevTools
- `[App] App opened with URL: labor://contract/...` 메시지 확인

## 확인 사항

✅ **코드:**
- `@capacitor/app` 플러그인 설치됨
- Deep link 처리 로직 있음
- AndroidManifest.xml에 intent-filter 설정됨

✅ **설정:**
- AndroidManifest.xml: `labor://` scheme 설정됨
- 앱 패키지: `com.ecospott.labor`

⏳ **필요한 작업:**
- 최신 코드로 다시 빌드
- 기존 앱 삭제 후 새 APK 설치
- 테스트

## 문제 해결

### 앱이 안 열리는 경우
1. AndroidManifest.xml 확인
2. 앱 패키지 이름 확인 (`com.ecospott.labor`)
3. 앱이 실제로 설치되어 있는지 확인
4. ADB로 직접 테스트: `adb shell am start -W -a android.intent.action.VIEW -d "labor://contract/test123" com.ecospott.labor`

### 앱이 열리지만 계약서가 안 나오는 경우
1. 앱 콘솔 로그 확인
2. Deep link URL 파싱 확인
3. `loadContractAndShow` 함수 확인
