# 근로자 계약 관리 플랫폼

근로자와 기업을 중계하는 플랫폼입니다. 기업(고용주)는 웹 어드민을 통해, 근로자는 모바일 앱을 통해 플랫폼을 사용합니다.

## 프로젝트 구조

이 프로젝트는 **Monorepo** 구조로 구성되어 있습니다:

```
.
├── apps/
│   ├── admin/          # 웹 어드민 (기업용)
│   └── mobile/         # 모바일 앱 (근로자용, PWA)
├── packages/
│   └── shared/         # 공통 코드 (타입, 데이터 등)
└── package.json        # 루트 설정
```

## 설치

```bash
# 루트에서 모든 패키지 설치
npm install

# 각 앱의 의존성 설치
cd apps/admin && npm install
cd ../mobile && npm install
```

## 개발 서버 실행

### 어드민 웹 (포트 5173)
```bash
npm run dev:admin
# 또는
cd apps/admin && npm run dev
```

접속: http://localhost:5173

### 모바일 앱 (포트 5174)
```bash
npm run dev:mobile
# 또는
cd apps/mobile && npm run dev
```

접속: http://localhost:5174

## 빌드

### 어드민 웹 빌드
```bash
npm run build:admin
# 빌드 결과: apps/admin/dist/
```

### 모바일 앱 빌드
```bash
npm run build:mobile
# 빌드 결과: apps/mobile/dist/
```

### 전체 빌드
```bash
npm run build
```

## 배포

### 환경 변수 설정

배포 전에 각 앱의 환경 변수를 설정해야 합니다.

#### 어드민 웹 (`apps/admin/.env`)
```bash
VITE_API_URL=https://your-api-domain.com
VITE_MOBILE_APP_URL=https://your-mobile-app-domain.com
```

#### 모바일 앱 (`apps/mobile/.env`)
```bash
VITE_API_URL=https://your-api-domain.com
```

### 빌드

#### 어드민 웹 빌드
```bash
cd apps/admin
npm run build
# 빌드 결과: apps/admin/dist/
```

#### 모바일 앱 빌드
```bash
cd apps/mobile
npm run build
# 빌드 결과: apps/mobile/dist/
```

### 배포 방법

#### Vercel 배포 (권장)

1. **어드민 웹 배포:**
   ```bash
   cd apps/admin
   vercel --prod
   ```
   - 환경 변수 설정:
     - `VITE_API_URL`: 백엔드 API URL
     - `VITE_MOBILE_APP_URL`: 모바일 앱 URL

2. **모바일 앱 배포:**
   ```bash
   cd apps/mobile
   vercel --prod
   ```
   - 환경 변수 설정:
     - `VITE_API_URL`: 백엔드 API URL

#### Netlify 배포

1. **어드민 웹:**
   - `apps/admin/dist/` 폴더를 드래그 앤 드롭
   - 환경 변수 설정 (Netlify 대시보드에서)

2. **모바일 앱:**
   - `apps/mobile/dist/` 폴더를 드래그 앤 드롭
   - 환경 변수 설정 (Netlify 대시보드에서)

#### GitHub Pages 배포

1. **GitHub 저장소 생성 및 코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/yourrepo.git
   git push -u origin main
   ```

2. **GitHub Pages 활성화**
   - 저장소 Settings → Pages
   - Source를 "GitHub Actions"로 설정

3. **Secrets 설정**
   - Settings → Secrets and variables → Actions
   - `VITE_API_URL`: 백엔드 API URL
   - `VITE_MOBILE_APP_URL`: 모바일 앱 URL (어드민 웹만)

4. **자동 배포**
   - 코드를 푸시하면 자동으로 빌드 및 배포됩니다
   - `.github/workflows/deploy-admin.yml` (어드민 웹)
   - `.github/workflows/deploy-mobile.yml` (모바일 앱)

자세한 내용은 [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)를 참고하세요.

#### 기타 호스팅 서비스

- `apps/admin/dist/` 폴더를 어드민 웹 호스팅 서비스에 업로드
- `apps/mobile/dist/` 폴더를 모바일 앱 호스팅 서비스에 업로드
- 각 서비스의 환경 변수 설정 방법에 따라 환경 변수 설정

### 배포 후 확인 사항

1. ✅ 어드민 웹이 정상적으로 로드되는지 확인
2. ✅ 모바일 앱이 정상적으로 로드되는지 확인
3. ✅ 로그인이 정상적으로 작동하는지 확인
4. ✅ 초대 링크가 올바른 모바일 앱 URL로 생성되는지 확인
5. ✅ API 호출이 정상적으로 작동하는지 확인

### 초대 링크 형식 (배포 환경)

배포 후 초대 링크는 다음과 같은 형식으로 생성됩니다:
```
https://your-mobile-app-domain.com/invite.html?invite={companyId}
```

## 주요 기능

### 어드민 웹
- 로그인 및 인증
- 근로자 계약 관리
- 초대 링크 생성 및 발송
- 직인 관리
- 계약서 상태 관리

### 모바일 앱
- 초대 링크를 통한 접속
- 근로자 정보 등록
- 전자계약서 검토 및 서명
- PDF 다운로드

## 공통 코드

`packages/shared/` 폴더에는 두 앱에서 공유하는 코드가 있습니다:
- 타입 정의 (User, Employee, Company 등)
- Mock 데이터 (companies, initialEmployees)

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **PWA** - 모바일 앱 기능 (vite-plugin-pwa)

## 개발 가이드

### 새로운 기능 추가
1. 공통 타입/데이터는 `packages/shared/`에 추가
2. 어드민 전용 기능은 `apps/admin/src/`에 추가
3. 모바일 전용 기능은 `apps/mobile/src/`에 추가

### 초대 링크 형식
```
http://your-domain.com/mobile?invite={companyId}
```

예: `http://localhost:5174?invite=c4`
