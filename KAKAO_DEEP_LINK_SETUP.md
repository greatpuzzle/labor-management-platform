# 카카오톡 Deep Link 설정 가이드

## 개요
카카오톡에서 계약서 링크를 클릭했을 때:
1. **앱이 설치되어 있으면** → 앱으로 연결되어 계약서 서명
2. **앱이 설치되어 있지 않으면** → 카카오톡 웹뷰에서 계약서 서명 가능

## Android 설정

### 1. AndroidManifest.xml 수정
`apps/mobile/android/app/src/main/AndroidManifest.xml`에 다음을 추가:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">
    
    <!-- 기존 intent-filter -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- Deep Link: Custom Scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="labor" />
    </intent-filter>
    
    <!-- Deep Link: Intent URL (카카오톡용) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="labor" android:host="contract" />
    </intent-filter>
</activity>
```

### 2. 앱에서 Deep Link 처리
`apps/mobile/src/App.tsx`에 이미 추가됨:
- `@capacitor/app` 플러그인으로 deep link 이벤트 리스너 추가 필요

## iOS 설정

### 1. Info.plist 수정
`apps/mobile/ios/App/App/Info.plist`에 다음을 추가:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>labor</string>
        </array>
    </dict>
</array>
```

### 2. Universal Links (선택사항)
도메인 기반 deep link를 사용하려면:
- Apple Developer에서 Associated Domains 설정
- `apple-app-site-association` 파일을 서버에 배치

## 테스트

### Android
```bash
# Custom scheme 테스트
adb shell am start -W -a android.intent.action.VIEW -d "labor://contract/test123" com.ecospott.labor

# Intent URL 테스트
adb shell am start -W -a android.intent.action.VIEW -d "intent://contract/test123#Intent;scheme=labor;package=com.ecospott.labor;end"
```

### iOS
```bash
# Custom scheme 테스트
xcrun simctl openurl booted "labor://contract/test123"
```

## 카카오톡에서 테스트
1. 카카오톡에서 계약서 링크 전송
2. 링크 클릭 시:
   - 앱이 설치되어 있으면 → 앱으로 이동
   - 앱이 설치되어 있지 않으면 → 웹뷰에서 계약서 서명

## 참고
- Custom scheme: `labor://contract/{contractId}`
- Intent URL (Android): `intent://contract/{contractId}#Intent;scheme=labor;package=com.ecospott.labor;end`
