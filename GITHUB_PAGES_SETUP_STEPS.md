# GitHub Pages 배포 확인 가이드

## 현재 상황

GitHub Pages 설정 페이지에서 "Build and deployment"나 "Source" 버튼이 보이지 않는 것은 정상입니다. Actions 기반 배포에서는 별도의 Source 설정이 필요 없습니다.

## 배포 확인 방법

### 1. Actions 탭 확인

1. GitHub 저장소로 이동
2. 상단 메뉴에서 **"Actions"** 탭 클릭
3. 다음 워크플로우가 보여야 합니다:
   - "Deploy Admin to GitHub Pages"
   - "Deploy Mobile to GitHub Pages"

### 2. 워크플로우 실행 확인

- 워크플로우가 자동으로 실행 중이거나 완료되어야 합니다
- 노란색 점: 실행 중
- 초록색 체크: 성공
- 빨간색 X: 실패

### 3. 첫 배포 시 환경 설정

첫 배포 시 GitHub Pages 환경을 생성해야 할 수 있습니다:

1. **Actions 탭**에서 워크플로우 클릭
2. 오른쪽 상단의 **"Review deployments"** 또는 환경 이름 클릭
3. **"Configure"** 버튼 클릭
4. **"Required reviewers"**는 비워두고 저장

### 4. 배포 URL 확인

배포가 완료되면:

1. **Settings → Pages**로 이동
2. 상단에 배포된 URL이 표시됩니다
3. 또는 **Actions** 탭의 워크플로우 실행 결과에서 URL 확인

## 수동으로 워크플로우 실행하기

워크플로우가 자동으로 실행되지 않았다면:

1. **Actions** 탭으로 이동
2. 왼쪽 사이드바에서 워크플로우 선택 (예: "Deploy Admin to GitHub Pages")
3. 오른쪽 상단의 **"Run workflow"** 버튼 클릭
4. 브랜치 선택 (main)
5. **"Run workflow"** 클릭

## Secrets 설정 (환경 변수)

배포 전에 환경 변수를 설정해야 합니다:

1. **Settings → Secrets and variables → Actions**
2. **"New repository secret"** 클릭
3. 다음 Secrets 추가:

### 어드민 웹용:
- **Name**: `VITE_API_URL`
  - **Value**: 백엔드 API URL (예: `https://api.yourdomain.com`)

- **Name**: `VITE_MOBILE_APP_URL`
  - **Value**: 모바일 앱 URL (예: `https://yourusername.github.io/yourrepo-mobile`)

### 모바일 앱용:
- **Name**: `VITE_API_URL`
  - **Value**: 백엔드 API URL

## 문제 해결

### 워크플로우가 보이지 않는 경우

1. 코드가 제대로 푸시되었는지 확인
2. `.github/workflows/` 폴더가 있는지 확인
3. 브랜치가 `main`인지 확인

### 배포가 실패하는 경우

1. **Actions** 탭에서 실패한 워크플로우 클릭
2. 로그를 확인하여 오류 원인 파악
3. 일반적인 원인:
   - Secrets가 설정되지 않음
   - 빌드 오류
   - 환경이 생성되지 않음

### 환경이 생성되지 않는 경우

1. **Settings → Environments**로 이동
2. **"New environment"** 클릭
3. 이름: `github-pages`
4. 저장

## 배포 완료 확인

배포가 성공하면:

1. **Settings → Pages**에서 URL 확인
2. URL로 접속하여 사이트가 정상 작동하는지 확인
3. 기본 URL 형식: `https://greatpuzzle.github.io/labor-management-platform`

