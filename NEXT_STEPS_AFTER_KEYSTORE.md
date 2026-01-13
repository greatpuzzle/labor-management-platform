# 키스토어 생성 완료 후 다음 단계

## 1단계: key.properties 파일 생성

`apps/mobile/android/key.properties` 파일을 생성하고 다음 내용을 입력하세요:

```properties
storePassword=여기에_키스토어_비밀번호_입력
keyPassword=여기에_키스토어_비밀번호_입력
keyAlias=labor-management
storeFile=app/labor-management-release.keystore
```

**중요:** 
- `storePassword`와 `keyPassword`는 키스토어 생성 시 입력한 비밀번호와 **정확히 동일**해야 합니다
- 이 파일은 Git에 커밋되지 않습니다 (보안)

### 파일 생성 방법

터미널에서:
```bash
cd apps/mobile/android
nano key.properties
```

또는 텍스트 에디터로 직접 생성:
- 파일 경로: `apps/mobile/android/key.properties`
- 위 내용을 복사해서 붙여넣기
- 비밀번호 부분만 실제 비밀번호로 변경

## 2단계: Release APK 빌드

key.properties 파일을 생성한 후:

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

빌드된 APK 위치:
- `app/build/outputs/apk/release/app-release.apk`

## 3단계: APK 설치

### 방법 1: ADB 사용
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

### 방법 2: 직접 전송
1. APK 파일을 핸드폰으로 전송
2. 파일 관리자에서 APK 파일 클릭
3. "알 수 없는 출처" 허용
4. 설치 완료

## 키스토어 백업 확인

**매우 중요:** 키스토어 파일과 비밀번호를 안전한 곳에 백업했는지 확인하세요!

1. 키스토어 파일: `apps/mobile/android/app/labor-management-release.keystore`
2. 비밀번호: 키스토어 생성 시 입력한 비밀번호
3. 백업 위치: USB, 클라우드 등 여러 곳에 백업

## 완료!

이제 Release APK를 빌드하고 배포할 수 있습니다! 🎉
