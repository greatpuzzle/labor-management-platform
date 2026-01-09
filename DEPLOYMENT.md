# 배포 가이드

이 문서는 근로자 계약 관리 플랫폼을 배포하는 방법을 설명합니다.

## 사전 준비

1. **백엔드 서버 배포 완료**
   - NestJS 백엔드가 배포되어 있어야 합니다
   - API URL을 확인하세요 (예: `https://api.yourdomain.com`)

2. **환경 변수 준비**
   - 어드민 웹: `VITE_API_URL`, `VITE_MOBILE_APP_URL`
   - 모바일 앱: `VITE_API_URL`

## 빠른 배포 (Vercel)

### 1. 어드민 웹 배포

```bash
# 어드민 웹 디렉토리로 이동
cd apps/admin

# Vercel CLI 설치 (처음만)
npm i -g vercel

# 배포
vercel --prod
```

**환경 변수 설정:**
- Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
- `VITE_API_URL`: 백엔드 API URL (예: `https://api.yourdomain.com`)
- `VITE_MOBILE_APP_URL`: 모바일 앱 URL (예: `https://mobile.yourdomain.com`)

### 2. 모바일 앱 배포

```bash
# 모바일 앱 디렉토리로 이동
cd apps/mobile

# 배포
vercel --prod
```

**환경 변수 설정:**
- `VITE_API_URL`: 백엔드 API URL (예: `https://api.yourdomain.com`)

## 수동 빌드 및 배포

### 1. 빌드

```bash
# 루트 디렉토리에서
npm run build

# 또는 개별 빌드
cd apps/admin && npm run build
cd ../mobile && npm run build
```

### 2. 빌드 결과물

- 어드민 웹: `apps/admin/dist/`
- 모바일 앱: `apps/mobile/dist/`

### 3. 배포

빌드된 `dist` 폴더를 원하는 호스팅 서비스에 업로드:

- **Vercel**: `vercel --prod` 또는 드래그 앤 드롭
- **Netlify**: 드래그 앤 드롭 또는 Git 연동
- **GitHub Pages**: `dist` 폴더 내용을 `gh-pages` 브랜치에 푸시
- **기타 호스팅**: FTP/SFTP로 `dist` 폴더 내용 업로드

## 환경 변수 설정

### 개발 환경

각 앱의 루트에 `.env` 파일 생성:

**`apps/admin/.env`:**
```env
VITE_API_URL=http://localhost:3000
VITE_MOBILE_APP_URL=http://localhost:5174
```

**`apps/mobile/.env`:**
```env
VITE_API_URL=http://localhost:3000
```

### 프로덕션 환경

배포 플랫폼의 환경 변수 설정에서:

**어드민 웹:**
- `VITE_API_URL`: `https://api.yourdomain.com`
- `VITE_MOBILE_APP_URL`: `https://mobile.yourdomain.com`

**모바일 앱:**
- `VITE_API_URL`: `https://api.yourdomain.com`

## 배포 후 확인

### 1. 어드민 웹 확인

1. 배포된 URL 접속 (예: `https://admin.yourdomain.com`)
2. 로그인 페이지가 표시되는지 확인
3. 로그인 테스트:
   - 슈퍼 관리자: `admin@ecospott.com` / `password123`
   - 회사 관리자: `company@ecospott.com` / `password123`

### 2. 모바일 앱 확인

1. 배포된 URL 접속 (예: `https://mobile.yourdomain.com`)
2. 초대 링크 테스트:
   - 어드민에서 "초대 링크" 버튼 클릭
   - 생성된 링크가 올바른 모바일 앱 URL을 가리키는지 확인
   - 링크를 클릭하여 모바일 앱이 정상적으로 로드되는지 확인

### 3. API 연결 확인

1. 브라우저 개발자 도구 → Network 탭
2. 로그인 시도
3. API 요청이 정상적으로 전송되는지 확인
4. CORS 오류가 없는지 확인

## 문제 해결

### CORS 오류

백엔드 서버의 CORS 설정에 프론트엔드 도메인을 추가해야 합니다:

```typescript
// apps/backend/src/main.ts
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://admin.yourdomain.com',  // 추가
  'https://mobile.yourdomain.com', // 추가
];
```

### 환경 변수가 적용되지 않음

1. 빌드 전에 환경 변수가 설정되어 있는지 확인
2. Vite는 빌드 시점에 환경 변수를 번들에 포함시킵니다
3. 배포 후 환경 변수를 변경했다면 다시 빌드해야 합니다

### 초대 링크가 작동하지 않음

1. `VITE_MOBILE_APP_URL`이 올바르게 설정되었는지 확인
2. 모바일 앱이 해당 URL에서 정상적으로 로드되는지 확인
3. 브라우저 콘솔에서 오류 메시지 확인

## 배포 체크리스트

- [ ] 백엔드 서버 배포 완료
- [ ] 어드민 웹 빌드 완료
- [ ] 모바일 앱 빌드 완료
- [ ] 환경 변수 설정 완료
- [ ] 어드민 웹 배포 완료
- [ ] 모바일 앱 배포 완료
- [ ] 로그인 기능 테스트 완료
- [ ] 초대 링크 생성 및 테스트 완료
- [ ] API 연결 확인 완료
- [ ] CORS 설정 확인 완료

