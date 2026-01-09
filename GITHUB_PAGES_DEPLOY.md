# GitHub Pages 배포 가이드

이 문서는 GitHub Pages를 사용하여 어드민 웹과 모바일 앱을 배포하는 방법을 설명합니다.

## 사전 준비

1. **GitHub 저장소 생성**
   - GitHub에 새 저장소를 생성하거나 기존 저장소를 사용합니다
   - 코드를 GitHub에 푸시합니다

2. **GitHub Pages 활성화**
   - 저장소 Settings → Pages로 이동
   - Source를 "GitHub Actions"로 설정

## 자동 배포 설정 (GitHub Actions)

### 1. Secrets 설정

GitHub 저장소의 Settings → Secrets and variables → Actions에서 다음 Secrets를 추가합니다:

**어드민 웹용:**
- `VITE_API_URL`: 백엔드 API URL (예: `https://api.yourdomain.com`)
- `VITE_MOBILE_APP_URL`: 모바일 앱 URL (예: `https://yourusername.github.io/yourrepo-mobile`)

**모바일 앱용:**
- `VITE_API_URL`: 백엔드 API URL (예: `https://api.yourdomain.com`)

### 2. 워크플로우 파일 확인

프로젝트에 이미 다음 워크플로우 파일이 포함되어 있습니다:
- `.github/workflows/deploy-admin.yml` - 어드민 웹 자동 배포
- `.github/workflows/deploy-mobile.yml` - 모바일 앱 자동 배포

### 3. 코드 푸시

```bash
# 코드를 GitHub에 푸시
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

푸시하면 자동으로 빌드 및 배포가 시작됩니다.

### 4. 배포 확인

1. GitHub 저장소의 **Actions** 탭에서 배포 상태 확인
2. 배포 완료 후 **Settings → Pages**에서 배포된 URL 확인
3. 배포된 URL로 접속하여 정상 작동 확인

## 배포 URL 형식

GitHub Pages는 다음과 같은 URL 형식으로 배포됩니다:

- **기본 도메인**: `https://yourusername.github.io/yourrepo`
- **커스텀 도메인**: 설정한 경우 커스텀 도메인 사용

## 두 개의 앱을 별도로 배포하는 방법

GitHub Pages는 하나의 저장소당 하나의 사이트만 배포할 수 있습니다. 두 앱을 모두 배포하려면:

### 방법 1: 별도 저장소 사용 (권장)

1. **어드민 웹 저장소**: `yourrepo-admin`
2. **모바일 앱 저장소**: `yourrepo-mobile`

각각 별도의 저장소로 분리하여 배포합니다.

### 방법 2: 서브 경로 사용

하나의 저장소에서 두 앱을 서브 경로로 배포하려면:

1. `apps/admin/vite.config.ts`에 `base: '/admin'` 추가
2. `apps/mobile/vite.config.ts`에 `base: '/mobile'` 추가
3. 루트에 `index.html`을 만들어 리다이렉트 설정

### 방법 3: gh-pages 브랜치 사용

수동으로 `gh-pages` 브랜치에 배포:

```bash
# 어드민 웹 빌드
cd apps/admin
npm run build

# gh-pages 브랜치에 배포
git checkout --orphan gh-pages
git rm -rf .
cp -r dist/* .
git add .
git commit -m "Deploy admin app"
git push origin gh-pages --force
```

## 환경 변수 설정

### GitHub Actions Secrets

GitHub 저장소의 Settings → Secrets and variables → Actions에서:

**어드민 웹:**
- `VITE_API_URL`: `https://api.yourdomain.com`
- `VITE_MOBILE_APP_URL`: `https://yourusername.github.io/yourrepo-mobile`

**모바일 앱:**
- `VITE_API_URL`: `https://api.yourdomain.com`

## 문제 해결

### 배포가 실패하는 경우

1. **Actions 탭에서 로그 확인**
   - 빌드 오류나 환경 변수 문제 확인

2. **환경 변수 확인**
   - Secrets가 올바르게 설정되었는지 확인

3. **빌드 로컬 테스트**
   ```bash
   cd apps/admin
   npm run build
   ```

### CORS 오류

백엔드 서버의 CORS 설정에 GitHub Pages 도메인을 추가:

```typescript
// apps/backend/src/main.ts
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://yourusername.github.io', // 추가
];
```

## 배포 체크리스트

- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] GitHub Pages 활성화 (Source: GitHub Actions)
- [ ] Secrets 설정 완료
- [ ] 워크플로우 파일 확인
- [ ] 코드 푸시하여 자동 배포 확인
- [ ] 배포된 URL 접속 테스트
- [ ] 로그인 기능 테스트
- [ ] 초대 링크 생성 및 테스트
- [ ] API 연결 확인

## 참고

- GitHub Pages는 무료로 제공됩니다
- 커스텀 도메인 설정 가능
- HTTPS 자동 지원
- 자동 배포로 코드 푸시 시 자동 업데이트

