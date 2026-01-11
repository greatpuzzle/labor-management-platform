# Android APK 빌드 가이드

이 가이드는 Android APK 파일을 빌드하고 테스트하는 방법을 설명합니다.

## 사전 요구사항

1. **Android Studio 설치**
   - [Android Studio 다운로드](https://developer.android.com/studio)
   - JDK 17 이상 필요

2. **Android SDK 설치**
   - Android Studio 설치 시 자동으로 설치됨
   - 최소 SDK 버전: 22 (Android 5.1)
   - 타겟 SDK 버전: 34 (Android 14)

3. **환경 변수 설정 (선택사항)**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   # 또는
   export ANDROID_HOME=$HOME/Android/Sdk  # Linux
   
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## 빠른 빌드 (명령어)

### 1. 웹 앱 빌드 및 동기화
```bash
cd apps/mobile
npm run android:build
```

이 명령어는:
- 웹 앱을 빌드합니다 (`npm run build`)
- Capacitor에 변경사항을 동기화합니다 (`npx cap sync android`)

### 2. APK 파일 빌드

#### 방법 1: 명령어로 빌드 (디버그 키 사용)
```bash
cd apps/mobile
npm run android:build:apk
```

빌드된 APK 위치:
- `apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`

#### 방법 2: Android Studio에서 빌드 (권장)

1. **Android Studio 열기**
   ```bash
   cd apps/mobile
   npm run cap:open:android
   ```

2. **Release APK 빌드**
   - Build > Generate Signed Bundle / APK
   - APK 선택
   - 키스토어 생성 또는 기존 키스토어 선택
   - Release 빌드 타입 선택
   - Finish 클릭

3. **빌드된 APK 위치**
   - Android Studio에서 "locate" 버튼 클릭
   - 또는 `apps/mobile/android/app/release/app-release.apk`

## 키스토어 생성 (처음 한 번만)

Release APK를 배포하려면 서명된 키스토어가 필요합니다.

### 키스토어 생성 명령어

```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore labor-management-release.keystore -alias labor-management -keyalg RSA -keysize 2048 -validity 10000
```

**입력 정보:**
- 키스토어 비밀번호: (안전한 비밀번호 입력)
- 이름: 그레이트퍼즐
- 조직 단위: 개발팀
- 조직: 그레이트퍼즐
- 도시: 서울
- 주/도: 서울
- 국가 코드: KR
- 확인: yes
- 키 비밀번호: (키스토어 비밀번호와 동일하거나 Enter)

### 키스토어 정보 저장

생성된 키스토어 파일과 비밀번호를 안전하게 보관하세요. APK 업데이트 시 필요합니다.

**주의:** 키스토어 파일을 잃어버리면 앱 업데이트가 불가능합니다!

## 키스토어로 APK 서명

### 1. 키스토어 설정 파일 생성

`apps/mobile/android/key.properties` 파일 생성:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=labor-management
storeFile=../app/labor-management-release.keystore
```

### 2. build.gradle 수정

`apps/mobile/android/app/build.gradle` 파일에 다음 코드 추가:

```gradle
// 키스토어 설정 로드
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... 기존 설정 ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. 서명된 APK 빌드

```bash
cd apps/mobile
npm run android:build:apk
```

서명된 APK 위치:
- `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

## 테스트용 APK 빌드 (디버그)

테스트 목적으로는 디버그 APK를 사용할 수 있습니다:

```bash
cd apps/mobile
npm run android:build
cd android
./gradlew assembleDebug
```

디버그 APK 위치:
- `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## APK 설치 및 테스트

### 방법 1: ADB로 직접 설치

1. **Android 기기 연결**
   - USB 디버깅 활성화
   - 개발자 옵션에서 "USB 디버깅" 켜기

2. **기기 확인**
   ```bash
   adb devices
   ```

3. **APK 설치**
   ```bash
   adb install apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

### 방법 2: APK 파일 전송 후 설치

1. **APK 파일을 기기로 전송**
   - 이메일, 클라우드 스토리지, USB 등

2. **기기에서 설치**
   - 파일 관리자에서 APK 파일 찾기
   - "알 수 없는 소스에서 설치 허용" 설정
   - APK 파일 탭하여 설치

### 방법 3: 웹 서버에 호스팅

1. **APK 파일을 웹 서버에 업로드**
   ```bash
   # 예: public/downloads/ 폴더에 업로드
   cp apps/mobile/android/app/build/outputs/apk/release/app-release.apk /path/to/web/server/downloads/labor-management.apk
   ```

2. **download.html 메타 태그 업데이트**
   ```html
   <meta name="android-apk-url" content="https://your-domain.com/downloads/labor-management.apk">
   ```

3. **테스트**
   - 계약서 링크 클릭
   - 설치 페이지로 자동 리다이렉트 확인
   - APK 다운로드 및 설치 확인

## 문제 해결

### 빌드 오류

1. **Gradle 동기화**
   ```bash
   cd apps/mobile/android
   ./gradlew clean
   ```

2. **캐시 정리**
   ```bash
   cd apps/mobile
   rm -rf android/app/build
   npm run android:build
   ```

3. **Capacitor 재동기화**
   ```bash
   cd apps/mobile
   rm -rf android
   npm run build
   npx cap add android
   npm run cap:sync
   ```

### APK 설치 오류

1. **"앱이 설치되지 않았습니다"**
   - 기기의 저장 공간 확인
   - 이전 버전 제거 후 재설치

2. **"알 수 없는 소스에서 설치 허용"**
   - 설정 > 보안 > 알 수 없는 소스 허용
   - 또는 파일 관리자 앱에서 직접 허용

3. **"패키지가 손상되었습니다"**
   - APK 파일이 완전히 다운로드되었는지 확인
   - 다시 빌드하여 새 APK 생성

## APK 버전 관리

### 버전 업데이트

`apps/mobile/android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2  // 숫자 증가 (1, 2, 3, ...)
    versionName "1.0.1"  // 버전 문자열
}
```

또는 `apps/mobile/package.json`의 버전을 자동으로 사용하도록 설정할 수 있습니다.

## 다음 단계

1. ✅ APK 빌드 완료
2. ✅ 테스트 기기에서 설치 확인
3. ⏭️ 웹 서버에 APK 업로드
4. ⏭️ download.html 링크 설정
5. ⏭️ 실제 계약서 링크에서 설치 테스트

## 참고 자료

- [Android 공식 빌드 가이드](https://developer.android.com/studio/build)
- [Capacitor Android 가이드](https://capacitorjs.com/docs/android)
- [APK 서명 가이드](https://developer.android.com/studio/publish/app-signing)

