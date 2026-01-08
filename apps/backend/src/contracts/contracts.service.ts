import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendContractDto } from './dto/send-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { ContractStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

  async sendContract(
    employeeId: string,
    sendContractDto: SendContractDto,
    sentBy: string,
  ) {
    // 직원 존재 확인
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // 1. Employee의 근로 조건 업데이트
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        workingHours: sendContractDto.workingHours,
        salary: sendContractDto.salary,
        contractPeriod: sendContractDto.contractPeriod,
        contractStatus: ContractStatus.SENT,
      },
    });

    // 2. Contract 레코드 생성
    const contract = await this.prisma.contract.create({
      data: {
        employeeId,
        workingHours: sendContractDto.workingHours,
        salary: sendContractDto.salary,
        contractPeriod: sendContractDto.contractPeriod,
        status: ContractStatus.SENT,
        sentAt: new Date(),
        sentBy,
      },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    // 3. 계약서 확인 링크 생성
    const mobileAppUrl =
      this.configService.get<string>('MOBILE_APP_URL') ||
      'http://localhost:5174';
    const contractLink = `${mobileAppUrl}/contract/${contract.id}`;
    const appInstallLink = `${mobileAppUrl}/download`; // 앱 다운로드 페이지

    // 4. 카카오톡 알림 전송
    const notificationResult =
      await this.notificationsService.sendContractNotification(
        employee.name,
        employee.phone,
        contractLink,
        appInstallLink,
      );

    return {
      contract,
      notification: notificationResult,
      links: {
        contractView: contractLink,
        appInstall: appInstallLink,
      },
    };
  }

  async signContract(employeeId: string, signContractDto: SignContractDto) {
    // 직원의 가장 최근 계약서 조회
    const contract = await this.prisma.contract.findFirst({
      where: {
        employeeId,
        status: ContractStatus.SENT,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employee: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(
        `No pending contract found for employee ${employeeId}`,
      );
    }

    // TODO: Base64 이미지를 실제 파일로 저장 (Cloudflare R2 또는 로컬)
    // 현재는 간단하게 Base64 문자열을 그대로 저장
    const signatureUrl = `data:image/png;base64,${signContractDto.signatureBase64}`;
    const pdfUrl = `data:application/pdf;base64,${signContractDto.pdfBase64}`;

    // 계약서 업데이트
    const updatedContract = await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureUrl,
        pdfUrl,
        signedAt: new Date(),
        status: ContractStatus.COMPLETED,
      },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    // Employee의 contractStatus도 COMPLETED로 변경
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        contractStatus: ContractStatus.COMPLETED,
      },
    });

    return updatedContract;
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.contract.findMany({
      where: { employeeId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: {
              select: {
                id: true,
                name: true,
                ceo: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }
}
