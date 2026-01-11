# Capacitor 네이티브 앱 설치 설정 가이드

## 개요

근로계약서 링크 클릭 시, Capacitor 네이티브 앱이 설치되어 있지 않으면 자동으로 앱 설치 페이지로 리다이렉트됩니다.

## 앱 설치 링크 설정

### 1. Android APK 다운로드 링크 설정

Android 앱의 경우 APK 파일을 서버에 호스팅하여 다운로드 링크를 제공해야 합니다.

#### APK 빌드 방법

```bash
cd apps/mobile

# 1. 웹 앱 빌드
npm run build

# 2. Capacitor 동기화
npm run cap:sync

# 3. Android Studio 열기
npm run cap:open:android

# 4. Android Studio에서:
#    - Build > Generate Signed Bundle / APK
#    - Release APK 선택
#    - APK 파일 생성 (예: app-release.apk)
```

#### APK 파일 호스팅

생성된 APK 파일을 다음 위치에 업로드:
- 예: `https://your-domain.com/downloads/labor-management.apk`

#### 환경 변수 설정

백엔드 `.env` 파일에 추가:
```env
ANDROID_APK_URL=https://your-domain.com/downloads/labor-management.apk
```

또는 `download.html`의 메타 태그 수정:
```html
<meta name="android-apk-url" content="https://your-domain.com/downloads/labor-management.apk">
```

### 2. iOS App Store 링크 설정

iOS 앱의 경우 App Store에 앱을 등록한 후 App Store 링크를 제공해야 합니다.

#### App Store 등록

1. **Apple Developer 계정 생성** (연 $99)
2. **Xcode에서 앱 빌드 및 업로드**
   ```bash
   cd apps/mobile
   npm run build
   npm run cap:sync
   npm run cap:open:ios
   ```
   - Xcode에서 Product > Archive
   - App Store Connect에 업로드
3. **App Store Connect에서 앱 정보 입력 및 심사 제출**
4. **심사 승인 후 App Store ID 확인**

#### 환경 변수 설정

백엔드 `.env` 파일에 추가:
```env
IOS_APP_STORE_URL=https://apps.apple.com/app/idYOUR_APP_ID
```

또는 `download.html`의 메타 태그 수정:
```html
<meta name="ios-app-store-url" content="https://apps.apple.com/app/idYOUR_APP_ID">
```

## 동작 흐름

1. 근로자가 카카오톡에서 "계약서 확인하기" 버튼 클릭
2. 계약서 링크 접속 (`/contract/{contractId}`)
3. Capacitor 앱 설치 여부 자동 판별
   - 앱이 설치되어 있음: 계약서 화면 표시
   - 앱이 설치되어 있지 않음: 설치 페이지로 자동 리다이렉트 (`/download.html?redirect=/contract/{contractId}`)
4. 설치 페이지에서 플랫폼별 설치 링크 제공
   - **Android**: APK 다운로드 버튼
   - **iOS**: App Store 링크 버튼
5. 앱 설치 후 원래 계약서 링크로 자동 이동

## 환경 변수 관리

### 백엔드 환경 변수

`apps/backend/.env`:
```env
# 모바일 앱 URL
MOBILE_APP_URL=https://mobile.your-domain.com

# 앱 설치 링크 (선택사항 - download.html 메타 태그로 대체 가능)
ANDROID_APK_URL=https://your-domain.com/downloads/labor-management.apk
IOS_APP_STORE_URL=https://apps.apple.com/app/idYOUR_APP_ID
```

### download.html 메타 태그

`apps/mobile/public/download.html`:
```html
<meta name="android-apk-url" content="https://your-domain.com/downloads/labor-management.apk">
<meta name="ios-app-store-url" content="https://apps.apple.com/app/idYOUR_APP_ID">
```

## 앱 빌드 및 배포 체크리스트

### Android

- [ ] Android Studio 설치
- [ ] JDK 17 이상 설치
- [ ] Android SDK 설치
- [ ] `npm run build` 실행
- [ ] `npm run cap:sync` 실행
- [ ] Android Studio에서 Release APK 생성
- [ ] APK 파일 서버에 업로드
- [ ] APK 다운로드 링크 설정
- [ ] 테스트 기기에서 APK 설치 테스트

### iOS

- [ ] Apple Developer 계정 생성 ($99/년)
- [ ] Xcode 설치 (macOS만 가능)
- [ ] `npm run build` 실행
- [ ] `npm run cap:sync` 실행
- [ ] Xcode에서 Archive 생성
- [ ] App Store Connect에 업로드
- [ ] 앱 정보 입력 및 심사 제출
- [ ] 심사 승인 대기 (보통 1-3일)
- [ ] App Store 링크 확인 및 설정
- [ ] TestFlight으로 베타 테스트 (선택사항)

## 문제 해결

### Android APK 다운로드가 안 되는 경우

1. **서버 CORS 설정 확인**
   - APK 파일 서버가 CORS를 허용하는지 확인
2. **파일 경로 확인**
   - APK 파일이 실제로 해당 URL에 있는지 확인
3. **HTTPS 사용**
   - Android는 HTTPS를 통한 다운로드를 권장
4. **파일 권한 확인**
   - 서버에서 파일 읽기 권한 확인

### iOS App Store 링크가 작동하지 않는 경우

1. **App Store ID 확인**
   - App Store Connect에서 정확한 앱 ID 확인
2. **앱 상태 확인**
   - 앱이 App Store에 출시되어 있는지 확인
3. **링크 형식 확인**
   - `https://apps.apple.com/app/id{APP_ID}` 형식 사용

## 개발 모드

개발 중에는 실제 APK 파일이나 App Store 링크가 없어도 테스트할 수 있습니다:

1. `download.html`에서 더미 링크 사용
2. 브라우저에서 테스트 (Capacitor 앱이 아닌 경우 자동으로 설치 페이지로 이동)
3. 실제 앱 설치 후 자동 리다이렉트 테스트

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Android APK 배포 가이드](https://developer.android.com/studio/publish)
- [iOS App Store 배포 가이드](https://developer.apple.com/app-store/)

