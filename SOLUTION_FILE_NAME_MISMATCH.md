# 파일명 불일치 문제 해결

## 발견된 문제

터미널 출력:
- 로컬: `index-DR49-q9s.js`
- 배포: `index-DIUDCVhl.js`
- **파일명이 다릅니다!**

또한:
- 배포된 파일에 이전 버전 로그 포함됨 (`Using hostname-based URL`)
- 배포된 파일에 새 코드 포함됨 (`AWS deployment detected`)

## 원인

1. **배포된 파일이 이전 빌드**입니다
2. **로컬 빌드와 배포된 파일이 다릅니다**
3. **기존 파일이 완전히 삭제되지 않았을 수 있습니다**

## 해결 방법

### 1. 파일명 확인

```bash
./check-file-names.sh
```

이 스크립트는:
- 로컬 빌드 파일명 확인
- 배포된 파일명 확인
- 파일명 비교
- HTML 파일 참조 확인
- 모든 JavaScript 파일 확인

### 2. 완전한 재배포 (권장)

```bash
./fix-deployment-complete.sh
```

이 스크립트는:
- 로컬 빌드 (기존 파일 삭제)
- 빌드 확인
- **EC2 서버의 기존 파일 완전 삭제**
- 새 파일 업로드
- 배포 확인

### 3. 수동으로 완전 삭제 후 재배포

```bash
# 1. 로컬 빌드
cd apps/admin
rm -rf dist node_modules/.vite
npm run build

# 2. EC2 서버에 기존 파일 완전 삭제
ssh -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109 "rm -rf /home/ubuntu/app/admin/*"

# 3. 새 파일 업로드
cd ../..
scp -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem -r apps/admin/dist/* ubuntu@43.200.44.109:~/app/admin/

# 4. 배포 확인
ssh -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109 << 'EOF'
  echo "배포된 파일:"
  ls -lh /home/ubuntu/app/admin/assets/index-*.js | head -3
  
  echo ""
  echo "HTML 파일이 참조하는 JavaScript:"
  grep -o 'index-[^"]*\.js' /home/ubuntu/app/admin/index.html | head -1
EOF
```

## 확인

배포 후:
1. 파일명이 일치하는지 확인
2. HTML 파일이 참조하는 JavaScript 파일명이 실제 파일명과 일치하는지 확인
3. 브라우저 캐시 완전 삭제 (시크릿 모드 사용)
