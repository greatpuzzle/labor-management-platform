import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Checking employee documents...\n');

  const company = await prisma.company.findFirst({
    where: { name: '사랑나눔협동조합' },
  });

  if (!company) {
    console.error('❌ Company "사랑나눔협동조합" not found.');
    return;
  }

  console.log(`✅ Found company: ${company.name} (${company.id})\n`);

  const employees = await prisma.employee.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      name: true,
      phone: true,
      documentUrl: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📋 Total employees: ${employees.length}\n`);

  employees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.name} (${emp.phone})`);
    console.log(`   ID: ${emp.id}`);
    console.log(`   Document URL: ${emp.documentUrl || '(없음)'}`);
    console.log(`   Has document: ${emp.documentUrl ? '✅' : '❌'}\n`);
  });

  const withDocs = employees.filter(emp => emp.documentUrl);
  const withoutDocs = employees.filter(emp => !emp.documentUrl);

  console.log(`\n📊 Summary:`);
  console.log(`   With documents: ${withDocs.length}`);
  console.log(`   Without documents: ${withoutDocs.length}`);

  if (withoutDocs.length > 0) {
    console.log(`\n⚠️  Employees without documents:`);
    withoutDocs.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.phone})`);
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
