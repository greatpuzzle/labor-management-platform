# APK 빌드 빠른 시작 가이드

이 가이드는 최소한의 설정으로 APK를 빌드하고 테스트하는 방법을 설명합니다.

## 🚀 빠른 시작 (3단계)

### 1단계: 웹 앱 빌드 및 동기화

```bash
cd apps/mobile
npm run android:build
```

이 명령어는 웹 앱을 빌드하고 Capacitor에 동기화합니다.

### 2단계: APK 빌드

#### 옵션 A: 스크립트 사용 (가장 쉬움)

```bash
cd apps/mobile
./build-apk.sh
```

또는 디버그 APK:
```bash
./build-apk.sh debug
```

#### 옵션 B: 명령어 직접 실행

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

디버그 APK:
```bash
./gradlew assembleDebug
```

### 3단계: APK 설치 및 테스트

#### 방법 1: ADB로 직접 설치 (권장)

1. Android 기기 연결 (USB 디버깅 활성화)
2. 기기 확인:
   ```bash
   adb devices
   ```
3. APK 설치:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release-unsigned.apk
   ```
   또는 디버그 APK:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### 방법 2: 파일 전송 후 설치

1. APK 파일 찾기:
   - Release: `apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`
   - Debug: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

2. APK 파일을 Android 기기로 전송 (이메일, 클라우드 등)

3. 기기에서:
   - 파일 관리자에서 APK 파일 찾기
   - "알 수 없는 소스에서 설치 허용" 설정
   - APK 파일 탭하여 설치

## 📱 테스트 시나리오

### 시나리오 1: 계약서 링크에서 앱 설치 테스트

1. **APK 파일을 웹 서버에 업로드**
   ```bash
   # 예: public/downloads/ 폴더
   cp apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk /path/to/web/server/downloads/labor-management.apk
   ```

2. **download.html 메타 태그 업데이트**
   - `apps/mobile/public/download.html` 파일 열기
   - 다음 줄 수정:
   ```html
   <meta name="android-apk-url" content="https://your-domain.com/downloads/labor-management.apk">
   ```
   또는 로컬 테스트:
   ```html
   <meta name="android-apk-url" content="http://192.168.x.x:5174/downloads/labor-management.apk">
   ```

3. **테스트**
   - 카카오톡에서 계약서 링크 클릭
   - 또는 브라우저에서 `/contract/{contractId}` 접속
   - 설치 페이지로 자동 리다이렉트 확인
   - APK 다운로드 버튼 클릭
   - APK 설치 확인

### 시나리오 2: 직접 APK 설치 테스트

1. APK 파일을 기기로 전송
2. 기기에서 APK 설치
3. 앱 실행
4. 계약서 링크 테스트

## 🔧 문제 해결

### "알 수 없는 소스에서 설치 허용" 설정

**Android 8.0 이상:**
1. 설정 > 앱 > 특별 액세스 > 알 수 없는 앱 설치
2. 사용할 브라우저 또는 파일 관리자 선택
3. "이 출처에서 허용" 활성화

**Android 7.0 이하:**
1. 설정 > 보안
2. "알 수 없는 소스" 체크

### APK 설치 실패

1. **이전 버전 제거**
   ```bash
   adb uninstall com.ecospott.labor
   ```

2. **캐시 정리 후 재빌드**
   ```bash
   cd apps/mobile
   rm -rf android/app/build
   npm run android:build
   cd android
   ./gradlew clean assembleRelease
   ```

### 빌드 오류

1. **Gradle 동기화**
   ```bash
   cd apps/mobile/android
   ./gradlew clean
   ```

2. **Capacitor 재동기화**
   ```bash
   cd apps/mobile
   npm run build
   npx cap sync android
   ```

## 📋 체크리스트

빌드 전:
- [ ] Android Studio 설치 확인
- [ ] Android SDK 설치 확인
- [ ] `npm install` 실행 완료

빌드:
- [ ] `npm run android:build` 성공
- [ ] APK 파일 생성 확인

테스트:
- [ ] APK 파일을 기기로 전송
- [ ] 기기에서 설치 성공
- [ ] 앱 실행 확인
- [ ] 계약서 링크 테스트

## 🎯 다음 단계

1. ✅ APK 빌드 완료
2. ✅ 테스트 기기에서 설치 확인
3. ⏭️ 웹 서버에 APK 업로드
4. ⏭️ download.html 링크 설정
5. ⏭️ 실제 계약서 링크에서 설치 테스트
6. ⏭️ 키스토어 생성 및 서명된 APK 빌드 (배포용)

## 💡 팁

- **테스트용**: 디버그 APK 사용 (빌드 빠름)
- **배포용**: 서명된 릴리즈 APK 사용 (키스토어 필요)
- **빠른 테스트**: ADB 사용 (USB 연결 필요)
- **원격 테스트**: 웹 서버에 APK 호스팅

## 📚 더 알아보기

- 상세 가이드: `BUILD_APK.md`
- Capacitor 가이드: `CAPACITOR.md`
- 앱 설치 설정: `CAPACITOR_APP_INSTALL.md`

