# 배포 상태 요약

## 현재 상태

✅ **배포는 완료되었습니다** (파일 업로드 및 PM2 프로세스 시작 완료)

❌ **하지만 백엔드 서버가 정상 작동하지 않습니다**

## 문제점

1. `backend-api` PM2 프로세스가 실행 중이지만 **37회 재시작** (계속 크래시 발생)
2. CPU 사용률 100% (무한 루프 또는 에러 반복)
3. 헬스 체크 응답 없음

## 원인 파악 필요

로그를 확인하여 정확한 에러 원인을 파악해야 합니다.

터미널에서 실행:
```bash
./check-backend-logs.sh
```

또는 직접:
```bash
ssh -i /Users/yoojihyeon/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109 "cd /home/ubuntu/app/backend && pm2 logs backend-api --err --lines 50 --nostream"
```

## 예상되는 원인

1. PostgreSQL 데이터베이스 연결 실패
2. 필수 환경 변수 누락
3. Prisma Client 생성 문제
