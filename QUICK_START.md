# 빠른 시작 가이드

## 서버 실행 오류 해결

"사이트에 연결할 수 없음" 또는 "ERR_CONNECTION_REFUSED" 오류가 발생하면 서버가 실행되지 않은 것입니다.

## 필요한 서버 실행

### 1. 백엔드 서버 (필수)

```bash
cd apps/backend
npm run start:dev
```

→ `http://localhost:3000`에서 실행됩니다

### 2. 어드민 웹 (필수)

**새 터미널 창에서:**
```bash
cd apps/admin
npm run dev
```

→ `http://localhost:5173`에서 실행됩니다

### 3. 모바일 앱 (테스트 링크 사용 시 필요)

**새 터미널 창에서:**
```bash
cd apps/mobile
npm run dev
```

→ `http://localhost:5174`에서 실행됩니다

## 한 번에 실행하기

### 방법 1: 각각 별도 터미널에서 실행

터미널 3개를 열어서 각각 실행:
- 터미널 1: 백엔드 서버
- 터미널 2: 어드민 웹
- 터미널 3: 모바일 앱

### 방법 2: 백그라운드 실행

```bash
# 백엔드 서버 (백그라운드)
cd apps/backend && npm run start:dev &

# 어드민 웹 (백그라운드)
cd apps/admin && npm run dev &

# 모바일 앱 (백그라운드)
cd apps/mobile && npm run dev &
```

## 실행 확인

서버가 정상적으로 실행되면:

1. **백엔드**: `http://localhost:3000` 접속 시 API 응답 확인
2. **어드민 웹**: `http://localhost:5173` 접속 시 로그인 페이지 표시
3. **모바일 앱**: `http://localhost:5174` 접속 시 앱 화면 표시

## 포트 확인

포트가 이미 사용 중인 경우:

```bash
# 포트 사용 확인
lsof -i :5173  # 어드민 웹
lsof -i :5174  # 모바일 앱
lsof -i :3000  # 백엔드
```

포트를 사용 중인 프로세스 종료:
```bash
kill -9 $(lsof -t -i:5173)  # 어드민 웹 포트
kill -9 $(lsof -t -i:5174)  # 모바일 앱 포트
kill -9 $(lsof -t -i:3000)  # 백엔드 포트
```

## 로그인 정보

### 슈퍼 관리자
- 이메일: `admin@ecospott.com`
- 비밀번호: `password123`

### 회사 관리자
- 이메일: `company@ecospott.com`
- 비밀번호: `password123`

## 테스트 링크 사용

모든 서버가 실행된 후:

1. 어드민 웹에 로그인 (`http://localhost:5173`)
2. "계약 관리" 탭으로 이동
3. "초대 링크" 버튼 클릭
4. 생성된 링크를 모바일 브라우저에서 열기

## 문제 해결

### 서버가 시작되지 않는 경우

1. **의존성 설치 확인:**
   ```bash
   npm install
   cd apps/admin && npm install
   cd ../mobile && npm install
   cd ../backend && npm install
   ```

2. **포트 충돌 확인:**
   - 다른 애플리케이션이 포트를 사용 중일 수 있습니다
   - 위의 포트 확인 명령어로 확인

3. **환경 변수 확인:**
   - 백엔드: `.env` 파일에 `DATABASE_URL` 설정 확인
   - 프론트엔드: `.env` 파일은 선택사항 (기본값 사용)

### 데이터베이스 연결 오류

백엔드 서버 실행 전에:
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed  # 초기 데이터 생성
```

