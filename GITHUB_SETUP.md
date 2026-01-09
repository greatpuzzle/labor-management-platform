# GitHub Pages 배포 설정 완료 안내

코드가 성공적으로 커밋되었습니다! 하지만 GitHub에 푸시하려면 추가 설정이 필요합니다.

## 현재 상황

- ✅ 모든 변경사항이 커밋되었습니다
- ❌ GitHub 푸시 실패: Personal Access Token에 `workflow` 권한이 없습니다

## 해결 방법

### 방법 1: Personal Access Token 업데이트 (권장)

1. **GitHub에서 새 토큰 생성:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" 클릭
   - 다음 권한 선택:
     - ✅ `repo` (전체 저장소 접근)
     - ✅ `workflow` (GitHub Actions 워크플로우 수정)
   - 토큰 생성 후 복사

2. **로컬 Git 설정 업데이트:**
   ```bash
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/greatpuzzle/labor-management-platform.git
   ```

3. **다시 푸시:**
   ```bash
   git push origin main
   ```

### 방법 2: SSH 키 사용

1. **SSH 키 생성 (이미 있다면 생략):**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **SSH 키를 GitHub에 추가:**
   - GitHub → Settings → SSH and GPG keys
   - "New SSH key" 클릭
   - `~/.ssh/id_ed25519.pub` 파일 내용 복사하여 추가

3. **원격 저장소 URL 변경:**
   ```bash
   git remote set-url origin git@github.com:greatpuzzle/labor-management-platform.git
   ```

4. **푸시:**
   ```bash
   git push origin main
   ```

### 방법 3: 워크플로우 파일 제외 후 푸시

워크플로우 파일을 제외하고 나머지만 푸시한 후, GitHub 웹 인터페이스에서 워크플로우 파일을 추가:

```bash
# 워크플로우 파일 제외
git rm --cached .github/workflows/*.yml
git commit -m "Remove workflow files temporarily"
git push origin main

# 이후 GitHub 웹 인터페이스에서 .github/workflows/ 폴더와 파일들을 직접 추가
```

## 푸시 완료 후 할 일

1. **GitHub Pages 활성화:**
   - 저장소 → Settings → Pages
   - Source를 "GitHub Actions"로 설정

2. **Secrets 설정:**
   - Settings → Secrets and variables → Actions
   - 다음 Secrets 추가:
     - `VITE_API_URL`: 백엔드 API URL
     - `VITE_MOBILE_APP_URL`: 모바일 앱 URL (어드민 웹만)

3. **배포 확인:**
   - Actions 탭에서 배포 상태 확인
   - 배포 완료 후 Settings → Pages에서 URL 확인

## 참고

- 커밋은 이미 완료되었으므로, 위 방법 중 하나로 푸시만 하면 됩니다
- 가장 간단한 방법은 방법 1 (Personal Access Token 업데이트)입니다

