# Push Notification 설정 가이드

## 개요

근로자 앱에서 Push Notification을 받기 위해서는 Firebase Cloud Messaging (FCM) for Android와 Apple Push Notification service (APNs) for iOS 설정이 필요합니다.

## 1. Firebase 프로젝트 설정

### 1.1 Firebase 콘솔에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정에서 "Cloud Messaging" 활성화

### 1.2 Android 앱 추가

1. Firebase Console > 프로젝트 설정 > 내 앱 > Android 앱 추가
2. 패키지 이름: `com.ecospott.labor`
3. `google-services.json` 파일 다운로드
4. 다운로드한 파일을 `apps/mobile/android/app/google-services.json`에 복사

### 1.3 iOS 앱 추가 (선택사항)

1. Firebase Console > 프로젝트 설정 > 내 앱 > iOS 앱 추가
2. 번들 ID: `com.ecospott.labor`
3. `GoogleService-Info.plist` 파일 다운로드
4. Xcode에서 프로젝트에 추가

## 2. Firebase Admin SDK 설정

### 2.1 서비스 계정 키 생성

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드 (예: `firebase-service-account.json`)

### 2.2 백엔드 환경 변수 설정

`apps/backend/.env` 파일에 다음 중 하나를 추가:

**방법 1: 파일 경로 지정**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json
```

**방법 2: JSON 문자열로 설정 (환경 변수에 JSON 직접 입력)**
```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

⚠️ **보안 주의**: 서비스 계정 키는 절대 Git에 커밋하지 마세요. `.env` 파일을 `.gitignore`에 추가해야 합니다.

## 3. Android 설정

### 3.1 AndroidManifest.xml 확인

`apps/mobile/android/app/src/main/AndroidManifest.xml`에 다음 권한이 추가되어 있는지 확인:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 3.2 build.gradle 확인

`apps/mobile/android/app/build.gradle`에서 Google Services 플러그인이 자동으로 적용되는지 확인:

```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

### 3.3 앱 빌드

```bash
cd apps/mobile
npm run android:build
```

## 4. iOS 설정 (선택사항)

### 4.1 Xcode 프로젝트 설정

1. `apps/mobile/ios/App/App.xcworkspace`를 Xcode로 열기
2. Capabilities에서 "Push Notifications" 활성화
3. "Background Modes"에서 "Remote notifications" 활성화

### 4.2 APNs 인증서 설정

1. Apple Developer Portal에서 APNs 인증서 생성
2. Firebase Console에 APNs 인증서 업로드

## 5. 테스트

### 5.1 Mock 모드 (Firebase 설정 없이)

Firebase 설정 없이도 앱은 정상 작동하며, Push Notification은 Mock 모드로 실행됩니다 (콘솔에 로그만 출력).

### 5.2 실제 전송 테스트

1. 앱 설치 후 계약서 서명 완료
2. 앱이 자동으로 Push Notification 토큰을 백엔드에 등록
3. 관리자가 일주일치 업무 스케줄 생성 시 자동으로 알림 전송 (매일 오전 9시)

## 6. 알림 전송 스케줄링

일주일치 업무 스케줄 생성 후 매일 오전 9시에 자동으로 알림을 전송하려면:

### 6.1 Cron Job 설정 (서버에서)

```bash
# 매일 오전 9시에 스크립트 실행
0 9 * * * /path/to/node /path/to/scripts/send-daily-notifications.js
```

### 6.2 Node.js Cron 라이브러리 사용 (백엔드 내부)

나중에 `@nestjs/schedule` 패키지를 추가하여 백엔드 내부에서 스케줄링할 수 있습니다.

## 7. 알림 메시지 형식

### 7.1 일일 업무 알림

```
제목: [회사명] 오늘 예정된 업무
내용: 오늘 예정된 업무가 2건 있습니다. (페트병 수거기기 작동 확인, 분쇄 페트 저장량 확인)
```

### 7.2 계약서 발송 알림 (향후 구현)

```
제목: 근로계약서 서명 요청
내용: 근로계약서가 발송되었습니다. 확인 후 서명해주세요.
데이터: { action: 'contract', contractId: '...' }
```

## 8. 문제 해결

### 8.1 토큰 등록 실패

- 네트워크 연결 확인
- 백엔드 서버 실행 확인
- 앱이 Capacitor 네이티브 앱으로 빌드되었는지 확인 (웹에서는 Push Notifications 미지원)

### 8.2 알림 수신 실패

- `google-services.json` 파일 위치 확인
- Firebase 프로젝트 설정 확인
- Android/iOS 권한 확인
- 토큰이 백엔드에 제대로 등록되었는지 확인

### 8.3 백엔드 오류

- Firebase Admin SDK 초기화 로그 확인
- 환경 변수 설정 확인
- 서비스 계정 키 파일 경로 확인

## 9. 보안 고려사항

1. **서비스 계정 키 보안**: 절대 Git에 커밋하지 마세요
2. **토큰 보안**: 토큰은 데이터베이스에 안전하게 저장되며, 각 근로자별로 고유합니다
3. **알림 내용**: 민감한 정보는 알림에 포함하지 마세요

## 10. 참고 자료

- [Firebase Cloud Messaging 문서](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications 문서](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)

