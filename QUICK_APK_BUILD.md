# 빠른 APK 빌드 (키스토어 없이)

## Debug APK 빌드 (간단, 바로 가능)

```bash
cd apps/mobile/android
./gradlew assembleDebug
```

빌드된 APK 위치:
- `app/build/outputs/apk/debug/app-debug.apk`

## 설치 방법

### 방법 1: ADB 사용 (권장)
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 방법 2: 직접 전송
- APK 파일을 핸드폰으로 전송
- 파일 관리자에서 APK 파일 클릭하여 설치
- "알 수 없는 출처" 허용 필요

## Debug APK vs Release APK

### Debug APK
✅ **키스토어 불필요** - 바로 빌드 가능  
✅ **다른 사람들도 설치 가능** - 누구나 설치 가능  
✅ **테스트에 충분** - 모든 기능 정상 작동  
⚠️ **디버그 정보 포함** - 파일 크기가 약간 큼  

### Release APK
✅ **최적화됨** - 파일 크기가 작음  
✅ **정식 서명** - Play Store 등록 가능  
⚠️ **키스토어 필요** - 빌드 전 설정 필요  

## 결론

**테스트 및 배포 목적이라면 Debug APK로 충분합니다!**
- 다른 사람들도 설치 가능
- 모든 기능 정상 작동
- 키스토어 생성 불필요

**나중에 Play Store에 등록할 때만 Release APK가 필요합니다.**
