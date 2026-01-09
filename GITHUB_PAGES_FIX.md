# GitHub Pages 배포 실패 해결 가이드

## 현재 문제

워크플로우가 실패하는 이유는 **GitHub Pages 환경이 생성되지 않았기 때문**입니다.

## 해결 방법

### 1단계: GitHub Pages 환경 생성

1. GitHub 저장소로 이동
2. **Settings** → **Environments** 클릭
3. **"New environment"** 버튼 클릭
4. 이름 입력: `github-pages`
5. **"Required reviewers"** 섹션은 비워두기 (자동 배포를 위해)
6. **"Save protection rules"** 클릭

### 2단계: GitHub Pages 활성화 확인

1. **Settings** → **Pages**로 이동
2. **"Build and deployment"** 섹션 확인
3. **Source**가 설정되어 있는지 확인
   - 없으면: **"Deploy from a branch"** 또는 **"GitHub Actions"** 선택

### 3단계: 워크플로우 다시 실행

1. **Actions** 탭으로 이동
2. 실패한 워크플로우 클릭
3. 오른쪽 상단의 **"Re-run jobs"** → **"Re-run failed jobs"** 클릭

또는

1. **Actions** 탭에서 워크플로우 선택
2. **"Run workflow"** 버튼 클릭
3. 브랜치 선택 (main)
4. **"Run workflow"** 클릭

## 중요 참고사항

### 두 개의 앱 배포 문제

GitHub Pages는 **하나의 저장소당 하나의 사이트만** 배포할 수 있습니다.

현재 두 워크플로우가 모두 같은 환경(`github-pages`)을 사용하므로:
- 하나만 성공할 수 있습니다
- 두 앱을 모두 배포하려면 **별도 저장소**를 사용해야 합니다

### 해결 방안

#### 옵션 1: 별도 저장소 사용 (권장)

1. **어드민 웹 저장소**: `labor-management-platform-admin`
2. **모바일 앱 저장소**: `labor-management-platform-mobile`

각각 별도 저장소로 분리하여 배포

#### 옵션 2: 하나만 배포

현재 저장소에서는 어드민 웹만 배포하고, 모바일 앱은 다른 플랫폼(Vercel, Netlify 등)에 배포

#### 옵션 3: 서브 경로 사용

하나의 저장소에서 두 앱을 서브 경로로 배포 (복잡함)

## 다음 단계

1. ✅ 환경 생성 완료
2. ⏳ 워크플로우 다시 실행
3. ⏳ 배포 성공 확인
4. ⏳ 배포된 URL 확인

## 배포 확인

배포가 성공하면:
- **Settings** → **Pages**에서 URL 확인
- URL 형식: `https://greatpuzzle.github.io/labor-management-platform`

