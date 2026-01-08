# Capacitor 네이티브 앱 빌드 가이드

이 모바일 앱은 Capacitor를 사용하여 네이티브 Android 및 iOS 앱으로 빌드할 수 있습니다.

## 사전 요구사항

### Android
- Android Studio 설치
- JDK 17 이상
- Android SDK

### iOS (macOS에서만 가능)
- Xcode 14 이상
- CocoaPods

## 설치 및 설정

이미 Capacitor가 설정되어 있습니다. 다음 명령어로 빌드 및 실행할 수 있습니다.

## 개발 워크플로우

### 1. 웹 앱 빌드
```bash
npm run build
```

### 2. 네이티브 프로젝트에 변경사항 동기화
```bash
npm run cap:sync
```

### 3. Android 앱 실행
```bash
npm run cap:run:android
```

또는 개별 단계:
```bash
# Android Studio 열기
npm run cap:open:android
```

### 4. iOS 앱 실행 (macOS만)
```bash
npm run cap:run:ios
```

또는:
```bash
# Xcode 열기
npm run cap:open:ios
```

## 개발 팁

### 라이브 리로드 사용하기

개발 중에는 capacitor.config.ts의 server 설정을 활성화하여 라이브 리로드를 사용할 수 있습니다:

```typescript
server: {
  url: 'http://localhost:5174',
  cleartext: true
}
```

이렇게 설정하면 네이티브 앱이 로컬 개발 서버(http://localhost:5174)에서 콘텐츠를 로드합니다.

**주의:** 실제 디바이스에서 테스트할 때는 localhost 대신 컴퓨터의 로컬 IP 주소를 사용해야 합니다 (예: http://192.168.1.100:5174).

### 프로덕션 빌드

프로덕션 빌드를 위해서는 server 설정을 주석 처리하거나 제거하고 다시 빌드하세요:

```bash
npm run build
npm run cap:sync
```

## 앱 아이콘 및 스플래시 스크린

앱 아이콘과 스플래시 스크린을 추가하려면:

1. `resources` 폴더에 아이콘과 스플래시 이미지 추가
2. `@capacitor/assets` 사용:
```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

## 플러그인 추가

추가 네이티브 기능이 필요한 경우 Capacitor 플러그인을 설치할 수 있습니다:

```bash
npm install @capacitor/camera
npm run cap:sync
```

## 문제 해결

### Android 빌드 오류
- Android Studio에서 Gradle 동기화 실행
- JDK 버전 확인
- `android/` 폴더를 삭제하고 `npx cap add android` 재실행

### iOS 빌드 오류
- `ios/App` 폴더에서 `pod install` 실행
- Xcode에서 프로비저닝 프로파일 설정 확인

## 배포

### Android
1. Android Studio에서 Build > Generate Signed Bundle / APK 선택
2. 키스토어 생성 또는 선택
3. Release 빌드 생성

### iOS
1. Xcode에서 Apple Developer 계정 설정
2. Product > Archive 선택
3. App Store Connect에 업로드

## 더 알아보기

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Android 개발 가이드](https://capacitorjs.com/docs/android)
- [iOS 개발 가이드](https://capacitorjs.com/docs/ios)
