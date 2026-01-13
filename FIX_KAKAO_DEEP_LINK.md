# 카카오톡 Deep Link 수정 가이드

## 문제
카카오톡에서 계약서 링크를 클릭해도 앱으로 연결되지 않음

## 해결 방법

### 1. 코드 수정 완료 ✅
- 앱스토어 링크가 없어도 앱 deep link 시도하도록 수정
- 앱이 없으면 웹뷰에서 계약서 서명 가능하도록 fallback

### 2. Android 설정 필요 ⚠️

`apps/mobile/android/app/src/main/AndroidManifest.xml` 파일을 열고, `<activity>` 태그에 다음을 추가:

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
    
    <!-- Deep Link: Custom Scheme (labor://) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="labor" android:host="contract" />
    </intent-filter>
    
    <!-- Deep Link: Intent URL (카카오톡용) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="labor" />
    </intent-filter>
</activity>
```

### 3. 앱에서 Deep Link 처리

앱이 deep link로 열렸을 때 계약서 ID를 파싱하여 계약서 화면으로 이동하도록 `App.tsx`에 추가 필요:

```typescript
// @capacitor/app 플러그인 설치 필요
import { App } from '@capacitor/app';

// 앱이 deep link로 열렸을 때 처리
App.addListener('appUrlOpen', (event) => {
  console.log('App opened with URL:', event.url);
  // labor://contract/contractId 형식 파싱
  const match = event.url.match(/labor:\/\/contract\/(.+)/);
  if (match) {
    const contractId = match[1];
    loadContractAndShow(contractId);
  }
});
```

### 4. 테스트

1. AndroidManifest.xml 수정 후 앱 재빌드
2. 카카오톡에서 계약서 링크 클릭
3. 앱이 열리면 → 성공 ✅
4. 앱이 안 열리면 → 웹뷰에서 계약서 서명 가능 ✅

## 현재 동작

1. **카카오톡에서 링크 클릭**
2. **앱 deep link 시도** (`labor://contract/contractId`)
3. **앱이 설치되어 있으면** → 앱으로 이동
4. **앱이 없으면** → 웹뷰에서 계약서 서명 가능
