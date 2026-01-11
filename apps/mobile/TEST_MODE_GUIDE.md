# 개발 모드 테스트 가이드

## 📱 개발 모드에서 웹에서도 테스트하기

개발 모드에서는 스토어 링크 없이도 웹 브라우저에서 계약서 서명을 테스트할 수 있습니다.

### 자동 감지

앱은 다음 조건을 만족하면 개발 모드로 동작합니다:
- `import.meta.env.DEV === true` (Vite 개발 모드)
- `window.location.hostname === 'localhost'`
- `window.location.hostname.includes('192.168.')` (로컬 네트워크)

### 개발 모드 동작

- ✅ **웹 브라우저에서 계약서 서명 화면 표시**
- ✅ **계약서 서명 및 다운로드 테스트 가능**
- ✅ **모든 기능 정상 작동**

### 프로덕션 모드 동작

- ⚠️ 스토어 링크가 설정되어 있으면 → 스토어로 리다이렉트
- ⚠️ 스토어 링크가 없으면 → "앱 설치 필요" 안내 화면 표시

---

## 📦 Android APK 빌드 방법

### 빠른 시작 (3단계)

#### 1단계: 웹 앱 빌드 및 동기화

```bash
cd apps/mobile
npm run build
npx cap sync android
```

#### 2단계: Android Studio 열기

```bash
npm run cap:open:android
```

#### 3단계: APK 빌드

Android Studio에서:
1. **Build > Generate Signed Bundle / APK** 선택
2. **APK** 선택
3. **키스토어 생성** (처음 한 번만):
   - Key store path: `apps/mobile/android/app/labor-management-release.keystore`
   - Password: 원하는 비밀번호 입력
   - Alias: `labor-management`
   - Password: 키스토어와 동일한 비밀번호
   - Validity: 10000 (년)
   - Certificate: 정보 입력
4. **Release** 빌드 타입 선택
5. **Finish** 클릭

### 또는 명령어로 빌드 (디버그 APK, 테스트용)

```bash
cd apps/mobile/android
./gradlew assembleDebug
```

빌드된 APK 위치:
- `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### APK 설치

#### 방법 1: ADB 사용 (권장)

```bash
# Android 기기 연결 (USB 디버깅 활성화)
adb devices

# APK 설치
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

#### 방법 2: 파일 전송

1. APK 파일을 Android 기기로 전송 (이메일, 클라우드 등)
2. 기기에서:
   - **설정 > 보안 > 알 수 없는 소스에서 설치 허용** 활성화
   - 파일 관리자에서 APK 파일 찾기
   - APK 파일 탭하여 설치

---

## 🧪 테스트 시나리오

### 시나리오 1: 웹에서 테스트 (개발 모드)

1. **개발 서버 실행**
   ```bash
   cd apps/mobile
   npm run dev
   ```

2. **계약서 링크 접속**
   - 카카오톡 메시지의 "계약서 확인하기" 버튼 클릭
   - 또는 브라우저에서 직접: `http://192.168.45.219:5174/contract/{contractId}`

3. **계약서 서명 테스트**
   - 웹 브라우저에서 계약서 확인 및 서명 가능
   - 서명 후 PDF 다운로드 테스트

### 시나리오 2: 앱에서 테스트 (APK 설치)

1. **APK 빌드** (위 방법 참고)

2. **APK 설치** (위 방법 참고)

3. **계약서 링크 접속**
   - 카카오톡 메시지의 "계약서 확인하기" 버튼 클릭
   - 앱이 자동으로 열리고 계약서 서명 화면 표시

4. **계약서 서명 테스트**
   - 앱에서 계약서 확인 및 서명
   - 서명 후 메인 화면으로 이동
   - 근무 기록 기능 테스트

---

## 🔧 문제 해결

### APK 빌드 오류

1. **Android Studio 설치 확인**
   - [Android Studio 다운로드](https://developer.android.com/studio)

2. **JDK 17 이상 설치 확인**
   ```bash
   java -version
   ```

3. **Android SDK 확인**
   - Android Studio > SDK Manager
   - Android SDK Platform 34 설치

### APK 설치 오류

1. **"알 수 없는 소스에서 설치 허용" 활성화**
   - 설정 > 보안 > 알 수 없는 소스에서 설치 허용

2. **이미 설치된 앱과 충돌**
   ```bash
   adb uninstall com.ecospott.labor
   adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **서명 키가 다른 경우**
   - 기존 앱 삭제 후 재설치

---

## 📝 참고 사항

- **개발 모드**: 현재는 `localhost` 또는 `192.168.*` IP로 접속하면 자동으로 개발 모드로 동작합니다.
- **프로덕션 모드**: 실제 도메인으로 배포되면 자동으로 프로덕션 모드로 전환됩니다.
- **APK 테스트**: 디버그 APK는 테스트용으로 사용하고, 실제 배포 시에는 서명된 릴리즈 APK를 사용하세요.

