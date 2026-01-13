# 최종 배포 가이드

## 상황

빌드된 파일에 문제가 없다고 확인되었습니다. 이제 배포만 하면 됩니다.

## 배포 방법

다음 스크립트를 실행하세요:

```bash
./deploy-and-verify.sh
```

이 스크립트는:
1. 로컬 빌드 확인
2. 빌드된 파일 내용 확인
3. EC2 서버에 배포
4. 배포 확인

## 또는 수동으로 배포

```bash
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
cd apps/admin
scp -i "$SSH_KEY_PATH" -r dist/* ubuntu@$EC2_IP:~/app/admin/
```

## 배포 후 확인

배포 후 브라우저 캐시를 완전히 지워야 합니다:

1. **시크릿 모드 사용 (권장)**
   - Chrome: `Ctrl+Shift+N` (Windows) 또는 `Cmd+Shift+N` (Mac)
   - 주소: http://43.200.44.109:3000

2. **또는 브라우저 캐시 완전 삭제**
   - Chrome: 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제
   - "캐시된 이미지 및 파일" 체크
   - 삭제 클릭

3. **개발자 도구**
   - F12로 개발자 도구 열기
   - Network 탭
   - "Disable cache" 체크
   - 페이지 새로고침

## 확인 사항

콘솔에서 다음 메시지 확인:
- ✅ `[API Client] AWS deployment detected, using port 3002`
- ✅ `[API Client] Using API Base URL: http://43.200.44.109:3002`
- ❌ `[API Client] Using hostname-based URL: 43.200.44.109` (이 메시지가 나오면 안 됨)
