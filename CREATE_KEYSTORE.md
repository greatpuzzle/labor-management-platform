# 키스토어 생성 가이드

## 키스토어 생성

```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore labor-management-release.keystore -alias labor-management -keyalg RSA -keysize 2048 -validity 10000
```

질문에 답변:
- 비밀번호: 원하는 비밀번호 입력 (나중에 필요)
- 이름, 조직 등: 정보 입력

## key.properties 파일 생성

`apps/mobile/android/key.properties` 파일 생성:

```properties
storePassword=your_password
keyPassword=your_password
keyAlias=labor-management
storeFile=app/labor-management-release.keystore
```

## Release APK 빌드

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

## 추천
**테스트 목적이라면 Debug APK를 사용하세요!** (키스토어 불필요)
