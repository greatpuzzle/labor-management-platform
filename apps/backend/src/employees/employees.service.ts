import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createEmployeeDto: CreateEmployeeDto) {
    // 회사 존재 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // 기본값 설정
    const employeeData = {
      ...createEmployeeDto,
      companyId,
      workingHours: createEmployeeDto.workingHours || '협의 후 결정',
      salary: createEmployeeDto.salary || '협의 후 결정',
      contractPeriod: createEmployeeDto.contractPeriod || '협의 후 결정',
      sensitiveInfoConsent: createEmployeeDto.sensitiveInfoConsent ?? false,
    };

    return this.prisma.employee.create({
      data: employeeData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ceo: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      include: {
        contracts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            workRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ceo: true,
            address: true,
            phone: true,
            stampImageUrl: true,
          },
        },
        contracts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        workRecords: {
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    // 직원 존재 확인
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ceo: true,
            phone: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // 직원 존재 확인
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    return {
      message: `Employee ${employee.name} has been deleted`,
      deletedEmployee: {
        id: employee.id,
        name: employee.name,
      },
    };
  }
}
