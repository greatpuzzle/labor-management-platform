# Admin 웹 재배포 가이드

## 재배포 스크립트

```bash
./redeploy-admin.sh
```

이 스크립트는:
1. 기존 dist 폴더 및 Vite 캐시 삭제
2. Admin 웹 재빌드
3. 빌드 확인 (새 코드 포함 여부)
4. EC2 서버에 배포
5. 배포 확인

## 또는 수동으로 재배포

```bash
# 1. Admin 웹 빌드
cd apps/admin
rm -rf dist node_modules/.vite
npm run build

# 2. EC2 서버에 배포
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

## 배포 후 브라우저 캐시 삭제 (필수!)

### 시크릿 모드 사용 (권장)

1. Chrome 시크릿 모드 열기:
   - Windows: `Ctrl + Shift + N`
   - Mac: `Cmd + Shift + N`
2. 주소 입력: http://43.200.44.109:3000
3. 시크릿 모드는 캐시를 사용하지 않으므로 새 파일이 로드됩니다.

### 또는 브라우저 캐시 완전 삭제

1. Chrome 설정 열기
2. 개인정보 및 보안 > 인터넷 사용 기록 삭제
3. "캐시된 이미지 및 파일" 체크
4. 삭제 클릭
5. 브라우저 완전히 닫기
6. 다시 열기

## 확인

브라우저 콘솔에서 확인:
- ✅ `[API Client] AWS deployment detected, using port 3002`
- ✅ `[API Client] Using API Base URL: http://43.200.44.109:3002`
- ❌ `[API Client] Using hostname-based URL: 43.200.44.109` (이 메시지가 나오면 안 됨)
