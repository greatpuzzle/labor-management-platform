# 키스토어 생성하기

## 방법 1: 스크립트 사용 (권장)

```bash
cd apps/mobile/android
./create-keystore.sh
```

스크립트가 실행되면:
1. 키스토어 비밀번호 입력 (2번)
2. 이름, 조직 등 정보 입력
3. 키스토어 파일 생성 완료

## 방법 2: 직접 명령어 실행

```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore labor-management-release.keystore -alias labor-management -keyalg RSA -keysize 2048 -validity 10000
```

**질문에 답변:**
- **비밀번호**: 원하는 비밀번호 입력 (나중에 필요하니 기억해두세요!)
- **비밀번호 확인**: 같은 비밀번호 다시 입력
- **이름**: 예) ECO Spot
- **조직 단위**: 예) 개발팀
- **조직**: 예) ECO Spot
- **도시**: 예) 서울
- **주/도**: 예) 서울
- **국가 코드**: KR
- **모두 맞습니까?**: y 입력

## 키스토어 생성 후

### 1. key.properties 파일 생성

`apps/mobile/android/key.properties` 파일을 생성하고 다음 내용 입력:

```properties
storePassword=여기에_키스토어_비밀번호_입력
keyPassword=여기에_키스토어_비밀번호_입력
keyAlias=labor-management
storeFile=app/labor-management-release.keystore
```

**중요:** 
- `storePassword`와 `keyPassword`는 키스토어 생성 시 입력한 비밀번호와 동일해야 합니다
- 이 파일은 Git에 커밋되지 않습니다 (보안)

### 2. Release APK 빌드

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

빌드된 APK 위치:
- `app/build/outputs/apk/release/app-release.apk`

## 키스토어 백업

**매우 중요:** 키스토어 파일과 비밀번호를 안전한 곳에 백업하세요!

1. 키스토어 파일: `apps/mobile/android/app/labor-management-release.keystore`
2. 비밀번호: 키스토어 생성 시 입력한 비밀번호
3. 백업 위치: USB, 클라우드 등 여러 곳에 백업
