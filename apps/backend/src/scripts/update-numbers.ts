import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateNumbers() {
  console.log('Updating business and resident numbers...');

  // Get all companies
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' },
  });

  // Update companies with businessNumber
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const businessNumber = `10081000${i + 1}`;

    await prisma.company.update({
      where: { id: company.id },
      data: { businessNumber },
    });

    console.log(`Updated company ${company.name} with businessNumber: ${businessNumber}`);
  }

  // Get all employees
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'asc' },
  });

  // Update employees with residentNumber
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    // dob format: YYYY-MM-DD, convert to YYMMDD
    const dobPart = employee.dob.replace(/-/g, '').substring(2); // Remove dashes and take last 6 digits
    const sequence = String(i + 1).padStart(6, '0');
    const residentNumber = `${dobPart}1${sequence}`;

    await prisma.employee.update({
      where: { id: employee.id },
      data: { residentNumber },
    });

    console.log(`Updated employee ${employee.name} with residentNumber: ${residentNumber}`);
  }

  console.log('✅ All records updated successfully!');

  await prisma.$disconnect();
  await pool.end();
}

updateNumbers()
  .catch((error) => {
    console.error('Error updating numbers:', error);
    process.exit(1);
  });
