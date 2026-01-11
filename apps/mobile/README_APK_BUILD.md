# Android APK 빌드 및 테스트 가이드

## 📦 준비된 파일

다음 파일들이 생성되었습니다:

1. **`BUILD_APK.md`** - 상세한 APK 빌드 가이드
2. **`QUICK_START_APK.md`** - 빠른 시작 가이드
3. **`build-apk.sh`** - 자동화된 빌드 스크립트
4. **`package.json`** - 빌드 스크립트 추가됨

## 🚀 빠른 시작

### 1. 웹 앱 빌드 및 동기화

```bash
cd apps/mobile
npm run android:build
```

### 2. APK 빌드

#### 방법 1: 스크립트 사용 (권장)

```bash
cd apps/mobile
./build-apk.sh
```

#### 방법 2: 직접 명령어

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

디버그 APK (테스트용):
```bash
./gradlew assembleDebug
```

### 3. APK 위치

빌드 완료 후 APK 파일 위치:

- **릴리즈 APK**: `apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **디버그 APK**: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 APK 설치 방법

### 방법 1: ADB 사용 (가장 빠름)

```bash
# 기기 연결 확인
adb devices

# APK 설치
adb install apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 방법 2: 파일 전송

1. APK 파일을 Android 기기로 전송 (이메일, 클라우드 등)
2. 기기에서 "알 수 없는 소스에서 설치 허용" 설정
3. APK 파일 탭하여 설치

## 🧪 테스트 시나리오

### 시나리오 1: 로컬 테스트 서버에서 APK 다운로드

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

3. **download.html 링크 업데이트 (선택사항)**
   - `public/download.html` 파일에서 메타 태그 확인
   - 로컬 테스트를 위해 자동으로 감지됨

4. **테스트**
   - 브라우저에서 `http://localhost:5174/download.html?redirect=/contract/test` 접속
   - Android 기기에서 APK 다운로드 버튼 확인
   - APK 다운로드 및 설치 테스트

### 시나리오 2: 실제 계약서 링크 테스트

1. **백엔드 서버 실행**
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **모바일 앱 서버 실행**
   ```bash
   cd apps/mobile
   npm run dev
   ```

3. **APK 파일 호스팅**
   - APK 파일을 웹 서버에 업로드
   - 또는 로컬 네트워크에서 접근 가능하도록 설정

4. **계약서 발송 및 테스트**
   - 어드민에서 계약서 발송
   - 카카오톡 알림 확인
   - "계약서 확인하기" 버튼 클릭
   - 설치 페이지로 리다이렉트 확인
   - APK 다운로드 및 설치 확인

## 🔧 문제 해결

### 빌드 오류

**Gradle 오류:**
```bash
cd apps/mobile/android
./gradlew clean
cd ..
npm run android:build
```

**Capacitor 동기화 오류:**
```bash
cd apps/mobile
rm -rf android
npm run build
npx cap add android
npm run cap:sync
```

### APK 설치 오류

**"앱이 설치되지 않았습니다":**
- 이전 버전 제거: `adb uninstall com.ecospott.labor`
- 저장 공간 확인
- APK 파일이 손상되지 않았는지 확인

**"알 수 없는 소스에서 설치 허용":**
- 설정 > 보안 > 알 수 없는 소스 허용
- 또는 파일 관리자 앱에서 직접 허용

## 📋 체크리스트

빌드 전:
- [ ] Android Studio 설치 확인
- [ ] Android SDK 설치 확인
- [ ] `npm install` 실행 완료

빌드:
- [ ] `npm run android:build` 성공
- [ ] APK 파일 생성 확인 (`android/app/build/outputs/apk/`)

설치:
- [ ] APK 파일을 기기로 전송
- [ ] 기기에서 설치 성공
- [ ] 앱 실행 확인

테스트:
- [ ] 앱에서 계약서 링크 접속 테스트
- [ ] 설치 페이지 리다이렉트 확인
- [ ] APK 다운로드 링크 작동 확인

## 🎯 다음 단계

1. ✅ APK 빌드 완료
2. ✅ 테스트 기기에서 설치 확인
3. ⏭️ 웹 서버에 APK 업로드
4. ⏭️ download.html 링크 설정
5. ⏭️ 실제 계약서 링크에서 설치 테스트
6. ⏭️ 키스토어 생성 및 서명된 APK 빌드 (배포용)

## 📚 더 알아보기

- **빠른 시작**: `QUICK_START_APK.md`
- **상세 가이드**: `BUILD_APK.md`
- **Capacitor 가이드**: `CAPACITOR.md`
- **앱 설치 설정**: `CAPACITOR_APP_INSTALL.md`

## 💡 팁

- **테스트용**: 디버그 APK 사용 (`./gradlew assembleDebug`)
- **배포용**: 서명된 릴리즈 APK 사용 (키스토어 필요)
- **빠른 테스트**: ADB 사용 (`adb install`)
- **원격 테스트**: 웹 서버에 APK 호스팅

