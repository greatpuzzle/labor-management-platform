# 앱스토어 링크 설정 가이드

## 현재 상황
앱스토어에 앱이 아직 등록되지 않은 상태입니다.

## 현재 동작
- **카카오톡에서 링크 클릭** → 웹뷰에서 계약서 서명 가능
- **앱이 설치되어 있으면** → 앱으로 연결 시도 (deep link)

## 나중에 앱스토어 링크 설정하기

### 1. 환경 변수 설정
프로젝트 루트 또는 `apps/mobile` 디렉토리에 `.env` 파일 생성:

```bash
# Android Play Store
VITE_ANDROID_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.ecospott.labor

# iOS App Store
VITE_IOS_APP_STORE_URL=https://apps.apple.com/app/idYOUR_APP_ID
```

### 2. 빌드 시 환경 변수 포함
Vite는 `VITE_` 접두사가 있는 환경 변수만 클라이언트에 노출됩니다.

### 3. 동작 변경
앱스토어 링크가 설정되면:
- **카카오톡에서 링크 클릭** → 앱 deep link 시도
  - **앱이 설치되어 있으면** → 앱으로 이동하여 계약서 서명
  - **앱이 설치되어 있지 않으면** → 앱스토어로 이동

## 테스트

### 현재 (앱스토어 링크 없음)
1. 카카오톡에서 계약서 링크 클릭
2. 웹뷰에서 계약서 서명 화면 표시 ✅

### 나중에 (앱스토어 링크 설정 후)
1. 카카오톡에서 계약서 링크 클릭
2. 앱이 설치되어 있으면 → 앱으로 이동
3. 앱이 설치되어 있지 않으면 → 앱스토어로 이동

## 참고
- Android Intent URL은 앱이 없으면 자동으로 `browser_fallback_url`로 이동
- iOS는 custom scheme이 실패해도 자동 리다이렉트가 안 되므로, 타임아웃 후 앱스토어로 이동
