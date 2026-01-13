# @capacitor/app 플러그인 설치 가이드

## 설치 필요
앱에서 deep link를 처리하려면 `@capacitor/app` 플러그인이 필요합니다.

## 설치 방법

```bash
cd apps/mobile
npm install @capacitor/app
npx cap sync
```

## 확인
설치 후 `package.json`에 다음이 추가되어야 합니다:
```json
"@capacitor/app": "^5.x.x"
```

## Android 설정
`apps/mobile/android/app/src/main/AndroidManifest.xml`에 intent-filter 추가 필요 (FIX_KAKAO_DEEP_LINK.md 참고)
