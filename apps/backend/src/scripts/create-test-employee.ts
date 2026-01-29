import { PrismaClient, DisabilityLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔧 Creating test employee...');

  // 회사 확인 또는 생성
  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { name: '(주)에코스팟' },
        { name: '에코스팟' },
      ],
    },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: '(주)에코스팟',
        ceo: '김철수',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
      },
    });
    console.log('✅ Created company:', company.name);
  } else {
    console.log('✅ Found company:', company.name);
  }

  // 테스트 근로자 확인 또는 생성
  const testPhone = '010-1234-1234';
  const normalizedPhone = '01012341234';

  let employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { phone: testPhone },
        { phone: normalizedPhone },
      ],
    },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        name: '김철수',
        phone: testPhone,
        dob: '1990-01-01',
        workingHours: '주 40시간 (09:00-18:00)',
        salary: '월 2,500,000원',
        contractPeriod: '2024-01-01 ~ 2025-12-31',
        disabilityLevel: DisabilityLevel.MILD,
        disabilityType: '지체장애',
        disabilityRecognitionDate: '2015-06-10',
        emergencyContactName: '김영수',
        emergencyContactPhone: '010-9999-8888',
        sensitiveInfoConsent: true,
        contractStatus: 'DRAFT',
      },
    });
    console.log('✅ Created test employee:', employee.name, employee.phone);
  } else {
    console.log('✅ Test employee already exists:', employee.name, employee.phone);
  }

  console.log('✅ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
