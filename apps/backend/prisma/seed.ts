import 'dotenv/config';
import { PrismaClient, UserRole, DisabilityLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. 회사 데이터 생성
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: '(주)에코스팟',
        ceo: '김철수',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
      },
    }),
    prisma.company.create({
      data: {
        name: '행복한일터',
        ceo: '이영희',
        address: '서울시 마포구 월드컵로 456',
        phone: '02-2345-6789',
      },
    }),
    prisma.company.create({
      data: {
        name: '희망복지센터',
        ceo: '박민수',
        address: '경기도 성남시 분당구 정자로 789',
        phone: '031-3456-7890',
      },
    }),
    prisma.company.create({
      data: {
        name: '사랑나눔협동조합',
        ceo: '정수진',
        address: '인천시 남동구 논현로 101',
        phone: '032-4567-8901',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // 2. 사용자 데이터 생성
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@ecospott.com',
      password: hashedPassword,
      name: '슈퍼관리자',
      phone: '010-0000-0000',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const companyAdmin = await prisma.user.create({
    data: {
      email: 'company@ecospott.com',
      password: hashedPassword,
      name: '회사관리자',
      phone: '010-1111-1111',
      role: UserRole.COMPANY_ADMIN,
      companyId: companies[0].id, // (주)에코스팟에 소속
    },
  });

  console.log(`✅ Created 2 users (super_admin, company_admin)`);

  // 3. 샘플 직원 데이터 생성 (선택사항)
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        companyId: companies[0].id,
        name: '김민지',
        phone: '010-2222-3333',
        dob: '1990-03-15',
        workingHours: '주 40시간 (09:00-18:00)',
        salary: '월 2,500,000원',
        contractPeriod: '2024-01-01 ~ 2025-12-31',
        disabilityLevel: DisabilityLevel.MILD,
        disabilityType: '지체장애',
        disabilityRecognitionDate: '2015-06-10',
        emergencyContactName: '김영수',
        emergencyContactPhone: '010-9999-8888',
        sensitiveInfoConsent: true,
      },
    }),
    prisma.employee.create({
      data: {
        companyId: companies[0].id,
        name: '박준호',
        phone: '010-3333-4444',
        dob: '1985-07-22',
        workingHours: '주 30시간 (10:00-16:00)',
        salary: '월 2,000,000원',
        contractPeriod: '2024-03-01 ~ 2025-02-28',
        disabilityLevel: DisabilityLevel.SEVERE,
        disabilityType: '시각장애',
        disabilityRecognitionDate: '2010-11-20',
        emergencyContactName: '박미경',
        emergencyContactPhone: '010-8888-7777',
        sensitiveInfoConsent: true,
      },
    }),
  ]);

  console.log(`✅ Created ${employees.length} sample employees`);

  console.log('✅ Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
