# GitHub Pages 배포 실패 해결 방법

## 문제 상황

워크플로우가 실패하는 주요 원인:
1. GitHub Pages 환경이 생성되지 않음
2. 두 워크플로우가 같은 환경을 사용하여 충돌

## 해결 방법

### 방법 1: GitHub Pages 환경 생성 (권장)

1. **Settings → Environments**로 이동
2. **"New environment"** 클릭
3. 이름: `github-pages`
4. **"Required reviewers"**는 비워두기 (자동 배포를 위해)
5. 저장

### 방법 2: Settings에서 Pages 활성화

1. **Settings → Pages**로 이동
2. **"Source"** 섹션 확인
3. **"Deploy from a branch"** 또는 **"GitHub Actions"** 선택
4. 저장

### 방법 3: 워크플로우 수정 (이미 적용됨)

워크플로우 파일이 업데이트되었습니다. 다시 푸시하면:
- 환경이 자동으로 생성되거나
- 환경 없이도 작동하도록 개선됨

## 다음 단계

1. 수정된 워크플로우를 푸시
2. Settings → Environments에서 환경 확인
3. 워크플로우 다시 실행

