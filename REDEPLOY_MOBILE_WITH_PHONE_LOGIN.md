# 모바일 앱 재배포 가이드 (핸드폰 인증 로그인 포함)

## 문제
서버에 배포된 모바일 앱이 최신 코드(핸드폰 인증 로그인)가 반영되지 않았습니다.

## 해결 방법

### 1단계: 최신 코드로 빌드

```bash
cd apps/mobile
npm run build
```

### 2단계: 서버에 배포

기존 배포 스크립트 사용:
```bash
cd ../..
./force-redeploy-mobile-v2.sh
```

또는 수동 배포:
```bash
# 서버에 접속
ssh -i your-key.pem ubuntu@43.200.44.109

# 모바일 앱 디렉토리로 이동
cd /var/www/mobile

# 기존 파일 백업 (선택사항)
sudo mv dist dist.backup.$(date +%Y%m%d_%H%M%S)

# 새 파일 업로드 (로컬에서)
# scp -r apps/mobile/dist/* ubuntu@43.200.44.109:/var/www/mobile/

# PM2 재시작
pm2 restart mobile-page
```

### 3단계: 확인

1. 브라우저에서 접속: http://43.200.44.109:3001
2. 핸드폰 인증 화면이 표시되는지 확인
3. 테스트:
   - 핸드폰 번호: `010-1234-1234`
   - 인증번호: `1234`

## 변경 사항

✅ 핸드폰 인증 로그인 화면 추가
✅ 임시 테스트용 인증번호 입력 기능
✅ 로그인 성공 시 메인 화면으로 이동

## 주의사항

- 서버에 배포된 파일이 최신 코드가 아닐 수 있습니다
- 반드시 빌드 후 재배포해야 합니다
- 브라우저 캐시를 지우고 테스트하세요 (Ctrl+Shift+R 또는 Cmd+Shift+R)
