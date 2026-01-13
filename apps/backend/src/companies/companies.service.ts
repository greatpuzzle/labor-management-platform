import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        employees: {
          select: {
            id: true,
            name: true,
            phone: true,
            contractStatus: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async generateInviteLink(companyId: string) {
    // 회사 존재 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // 초대 토큰 생성 (24시간 유효)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 실제 프로덕션에서는 초대 토큰을 DB에 저장하고 검증해야 함
    // 여기서는 간단하게 companyId를 인코딩
    const inviteToken = Buffer.from(
      JSON.stringify({
        companyId,
        token,
        expiresAt: expiresAt.toISOString(),
      }),
    ).toString('base64');

    // 프론트엔드 URL (환경변수에서 가져오거나 기본값 사용)
    const frontendUrl =
      process.env.MOBILE_APP_URL || 'http://43.200.44.109:3001';
    const inviteLink = `${frontendUrl}/register?token=${inviteToken}`;

    return {
      companyId,
      companyName: company.name,
      inviteLink,
      inviteToken,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
