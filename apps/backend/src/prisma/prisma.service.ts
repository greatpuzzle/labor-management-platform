import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(this.pool);
    this.prisma = new PrismaClient({ adapter });
  }

  get client() {
    return this.prisma;
  }

  async onModuleInit() {
    await this.prisma.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.pool.end();
    console.log('❌ Prisma disconnected from database');
  }

  // Proxy all Prisma Client methods
  get user() {
    return this.prisma.user;
  }

  get company() {
    return this.prisma.company;
  }

  get employee() {
    return this.prisma.employee;
  }

  get contract() {
    return this.prisma.contract;
  }

  get workRecord() {
    return this.prisma.workRecord;
  }
}
