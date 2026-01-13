# Release APK 빌드 가이드 (실제 배포용)

## 1단계: 키스토어 생성

터미널에서 실행:

```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore labor-management-release.keystore -alias labor-management -keyalg RSA -keysize 2048 -validity 10000
```

**질문에 답변:**
- **비밀번호**: 원하는 비밀번호 입력 (나중에 필요하니 기억해두세요!)
- **이름**: 예) ECO Spot
- **조직 단위**: 예) 개발팀
- **조직**: 예) ECO Spot
- **도시**: 예) 서울
- **주/도**: 예) 서울
- **국가 코드**: KR

**중요:** 키스토어 파일과 비밀번호는 **절대 잃어버리면 안 됩니다!** 나중에 앱 업데이트 시 필요합니다.

## 2단계: key.properties 파일 생성

`apps/mobile/android/key.properties` 파일을 생성하고 다음 내용을 입력:

```properties
storePassword=여기에_키스토어_비밀번호_입력
keyPassword=여기에_키스토어_비밀번호_입력
keyAlias=labor-management
storeFile=app/labor-management-release.keystore
```

**주의:** 
- `storePassword`와 `keyPassword`는 키스토어 생성 시 입력한 비밀번호와 동일해야 합니다
- 이 파일은 `.gitignore`에 추가되어 있어야 합니다 (보안)

## 3단계: Release APK 빌드

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

빌드된 APK 위치:
- `app/build/outputs/apk/release/app-release.apk`

## 4단계: APK 배포

생성된 `app-release.apk` 파일을:
- 서버에 업로드하여 다운로드 링크 제공
- 또는 직접 전송하여 설치

## 장점

✅ **다른 사람들도 설치 가능**: Release APK는 누구나 설치 가능  
✅ **실제 배포용**: Play Store에 등록하기 전에도 배포 가능  
✅ **서명됨**: 앱이 정식으로 서명되어 신뢰성 있음  

## 주의사항

⚠️ **키스토어 백업 필수**: 키스토어 파일(`labor-management-release.keystore`)과 비밀번호를 안전한 곳에 백업하세요  
⚠️ **앱 업데이트 시 필요**: 나중에 앱을 업데이트할 때 같은 키스토어가 필요합니다  
⚠️ **비밀번호 분실 금지**: 키스토어 비밀번호를 잃어버리면 앱을 업데이트할 수 없습니다  
