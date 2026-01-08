import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartWorkDto } from './dto/start-work.dto';
import { EndWorkDto } from './dto/end-work.dto';
import { WorkStatus } from '@prisma/client';
import { ExcelExportService } from './excel-export.service';

@Injectable()
export class WorkRecordsService {
  constructor(
    private prisma: PrismaService,
    private excelExportService: ExcelExportService,
  ) {}

  async startWork(employeeId: string, startWorkDto: StartWorkDto) {
    // 직원 존재 확인
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const startTime = new Date(startWorkDto.startTime);
    const date = startTime.toISOString().split('T')[0]; // YYYY-MM-DD

    // 근무 기록 생성
    const workRecord = await this.prisma.workRecord.create({
      data: {
        employeeId,
        date,
        startTime,
        status: WorkStatus.IN_PROGRESS,
        notes: startWorkDto.notes || '',
      },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    return workRecord;
  }

  async endWork(id: string, endWorkDto: EndWorkDto) {
    // 근무 기록 조회
    const workRecord = await this.prisma.workRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!workRecord) {
      throw new NotFoundException(`Work record with ID ${id} not found`);
    }

    if (workRecord.status === WorkStatus.COMPLETED) {
      throw new Error('This work record is already completed');
    }

    const endTime = new Date(endWorkDto.endTime);
    const startTime = new Date(workRecord.startTime);

    // 근무 시간 계산 (분 단위)
    const durationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
    );

    // 근무 기록 업데이트
    const updatedWorkRecord = await this.prisma.workRecord.update({
      where: { id },
      data: {
        endTime,
        duration: durationMinutes,
        status: WorkStatus.COMPLETED,
        notes: endWorkDto.notes || workRecord.notes,
      },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    return updatedWorkRecord;
  }

  async findByEmployee(employeeId: string, query?: { year?: number; month?: number }) {
    const where: any = { employeeId };

    // 연도/월 필터링
    if (query?.year && query?.month) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    } else if (query?.year) {
      const startDate = new Date(query.year, 0, 1);
      const endDate = new Date(query.year, 11, 31);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.workRecord.findMany({
      where,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByCompany(companyId: string, query?: { year?: number; month?: number }) {
    const where: any = {
      employee: {
        companyId,
      },
    };

    // 연도/월 필터링
    if (query?.year && query?.month) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    } else if (query?.year) {
      const startDate = new Date(query.year, 0, 1);
      const endDate = new Date(query.year, 11, 31);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.workRecord.findMany({
      where,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        employee: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async exportToExcel(companyId: string, year: number): Promise<Buffer> {
    // 회사의 모든 직원 조회
    const employees = await this.prisma.employee.findMany({
      where: { companyId },
      include: {
        company: true,
        workRecords: {
          where: {
            startTime: {
              gte: new Date(year, 0, 1),
              lte: new Date(year, 11, 31, 23, 59, 59),
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    // 데이터 가공
    const employeesData = employees.map((employee) => ({
      employee,
      workRecords: employee.workRecords.map((wr) => ({
        ...wr,
        employee,
      })),
      company: employee.company,
    }));

    // 엑셀 생성
    return this.excelExportService.generateEmploymentReport(
      employeesData,
      year,
    );
  }
}
