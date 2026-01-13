# Debug APK 빌드 가이드 (테스트용)

## 문제
Release APK 빌드 시 키스토어가 필요합니다. 테스트 목적이라면 Debug APK를 사용하세요.

## 해결 방법

### 방법 1: Debug APK 빌드 (간단, 테스트용)

```bash
cd apps/mobile/android
./gradlew assembleDebug
```

빌드된 APK 위치:
- `app/build/outputs/apk/debug/app-debug.apk`

### 방법 2: Release APK 빌드 (배포용, 키스토어 필요)

#### 1. 키스토어 생성
```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore labor-management-release.keystore -alias labor-management -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. key.properties 파일 생성
`apps/mobile/android/key.properties` 파일 생성:
```properties
storePassword=your_password
keyPassword=your_password
keyAlias=labor-management
storeFile=app/labor-management-release.keystore
```

#### 3. build.gradle에 서명 설정 추가
`apps/mobile/android/app/build.gradle` 파일에 서명 설정이 있는지 확인

#### 4. Release APK 빌드
```bash
cd apps/mobile/android
./gradlew assembleRelease
```

## 추천
**테스트 목적이라면 Debug APK를 사용하세요!** (방법 1)
