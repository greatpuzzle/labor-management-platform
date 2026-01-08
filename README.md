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

### 어드민 웹
- `apps/admin/dist/` 폴더를 웹 호스팅 서비스(Vercel, Netlify 등)에 배포
- 일반 웹사이트로 접근 가능

### 모바일 앱
- `apps/mobile/dist/` 폴더를 웹 호스팅 서비스에 배포
- PWA(Progressive Web App)로 작동
- 모바일 브라우저에서 "홈 화면에 추가" 기능 사용 가능
- 앱스토어 배포를 원할 경우 React Native로 전환 필요

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
