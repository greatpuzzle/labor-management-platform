# EC2 → RDS 마이그레이션 가이드

## 나중에 RDS로 마이그레이션하기

EC2에 PostgreSQL을 설치한 후, 나중에 AWS RDS로 마이그레이션할 수 있습니다.

## 마이그레이션 방법

### 방법 1: pg_dump 사용 (권장 - 간단)

#### 1. EC2에서 데이터베이스 덤프

```bash
# EC2 서버에 접속
ssh -i ~/Downloads/greatpuzzle-u.pem ubuntu@43.200.44.109

# 데이터베이스 덤프 생성
pg_dump -h localhost -U labor_user -d labor_management > backup.sql
```

#### 2. RDS 인스턴스 생성

1. AWS Console → RDS → 데이터베이스 생성
2. PostgreSQL 선택
3. 설정 완료 후 엔드포인트 확인

#### 3. RDS로 데이터 복원

```bash
# RDS로 데이터 복원
psql -h rds-endpoint.xxxxx.ap-northeast-2.rds.amazonaws.com \
     -U admin \
     -d labor_management \
     < backup.sql
```

#### 4. .env 파일 업데이트

```bash
# RDS 엔드포인트로 DATABASE_URL 변경
./update-database-url.sh
```

#### 5. 백엔드 재시작

```bash
pm2 restart backend-api
```

### 방법 2: AWS Database Migration Service (DMS) 사용

- AWS가 제공하는 전용 마이그레이션 서비스
- 무중단 마이그레이션 가능
- 설정이 복잡하지만 안전함

## 마이그레이션 시 고려사항

### 1. 데이터 무결성

- 마이그레이션 전 백업 필수
- 테스트 환경에서 먼저 시도
- 다운타임 계획

### 2. 애플리케이션 설정

- `.env` 파일의 `DATABASE_URL` 변경
- Prisma 클라이언트 재생성 필요 없음 (스키마 동일)
- 백엔드 재시작 필요

### 3. 연결 설정

- RDS 보안 그룹에서 EC2 IP 허용
- VPC 설정 확인
- 네트워크 접근 가능 여부 확인

## 마이그레이션 체크리스트

- [ ] RDS 인스턴스 생성 완료
- [ ] RDS 보안 그룹 설정 (EC2 IP 허용)
- [ ] EC2에서 데이터베이스 덤프 생성
- [ ] RDS로 데이터 복원 완료
- [ ] 데이터 검증 (레코드 수, 테이블 확인)
- [ ] `.env` 파일 업데이트
- [ ] 백엔드 재시작
- [ ] 애플리케이션 테스트
- [ ] 기존 EC2 PostgreSQL 삭제 (선택사항)

## 주의사항

1. **마이그레이션 전 백업 필수**
   ```bash
   pg_dump -h localhost -U labor_user -d labor_management > backup_before_migration.sql
   ```

2. **다운타임 계획**
   - 데이터 덤프 시간
   - 데이터 복원 시간
   - 애플리케이션 재시작 시간

3. **테스트 환경에서 먼저 시도**
   - 프로덕션 전 테스트 환경에서 연습

## 요약

✅ **EC2 → RDS 마이그레이션 가능**
- `pg_dump`로 데이터 덤프
- RDS로 데이터 복원
- `.env` 파일 업데이트
- 백엔드 재시작

✅ **스키마 변경 불필요**
- Prisma 스키마는 그대로 사용 가능
- 데이터베이스 엔진이 같으면 문제 없음

✅ **유연한 선택**
- 지금은 EC2 설치로 시작
- 나중에 필요하면 RDS로 마이그레이션
