# Android Deep Link 설정 완료 가이드

## ✅ 완료된 작업

`apps/mobile/android/app/src/main/AndroidManifest.xml` 파일에 deep link intent-filter를 추가했습니다.

## 추가된 내용

`<activity>` 태그 안에 다음 두 개의 `intent-filter`가 추가되었습니다:

1. **`labor://contract/contractId` 형식 처리**
   - 예: `labor://contract/cmkatfk0r0001sqqsrlnk7oek`
   
2. **`labor://` 형식 처리 (카카오톡용)**
   - 예: `labor://contract/cmkatfk0r0001sqqsrlnk7oek`

## 다음 단계

### 1. @capacitor/app 플러그인 설치
```bash
cd apps/mobile
npm install @capacitor/app
npx cap sync
```

### 2. 앱 재빌드
```bash
cd apps/mobile
npm run build
npx cap sync android
```

### 3. APK 재빌드 및 설치
Android Studio에서:
1. **Build > Clean Project**
2. **Build > Rebuild Project**
3. **Build > Generate Signed Bundle / APK**
4. 새 APK 설치

또는 명령어로:
```bash
cd apps/mobile/android
./gradlew assembleRelease
```

### 4. 테스트
1. 카카오톡에서 계약서 링크 클릭
2. 앱이 열리면 → 성공 ✅
3. 앱이 안 열리면 → 콘솔 로그 확인

## 확인 사항

- ✅ AndroidManifest.xml에 intent-filter 추가됨
- ⏳ @capacitor/app 플러그인 설치 필요
- ⏳ 앱 재빌드 필요
- ⏳ 새 APK 설치 필요
