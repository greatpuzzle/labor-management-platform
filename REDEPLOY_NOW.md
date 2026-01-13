# 즉시 재배포 필요

## 문제 상황

콘솔 로그:
- `[API Client] Using hostname-based URL: 43.200.44.109`
- `[API Client] Using API Base URL: http://43.200.44.109:3000` ❌
- API 요청이 HTML을 반환 (프론트엔드 서버 응답)

## 해결 완료

코드를 수정했습니다:
- **네트워크 IP 범위 체크** (192.168.x.x 등) → 포트 3000 (로컬 개발)
- **AWS EC2 IP 체크** (43.200.44.109) → 포트 3002
- **기타 프로덕션 환경** → 포트 3002

## 즉시 재배포

```bash
# 1. Admin 웹 빌드
cd apps/admin
rm -rf dist
npm run build

# 2. EC2 서버에 배포
cd ../..
SSH_KEY_PATH="/Users/yoojihyeon/Downloads/greatpuzzle-u.pem"
EC2_IP="43.200.44.109"
scp -i "$SSH_KEY_PATH" -r apps/admin/dist/* ubuntu@$EC2_IP:~/app/admin/
```

또는:

```bash
./quick-fix-admin.sh
```

## 브라우저 캐시 클리어

**반드시** 다음을 수행하세요:

1. **하드 리프레시**: `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)
2. **개발자 도구** (F12):
   - Network 탭
   - **"Disable cache" 체크**
   - 페이지 새로고침
3. **또는 시크릿 모드**에서 테스트

## 확인

브라우저 콘솔에서:
- ✅ `[API Client] AWS deployment detected, using port 3002`
- ✅ `[API Client] Using API Base URL: http://43.200.44.109:3002`
- ❌ `[API Client] Using hostname-based URL: 43.200.44.109` (이 메시지가 나오면 안 됨)
