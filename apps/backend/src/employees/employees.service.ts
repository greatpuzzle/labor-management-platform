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
    // 계약기간: 계약 체결 시점으로부터 1년
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    const formatDate = (d: Date) =>
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    const defaultContractPeriod = `${formatDate(today)} ~ ${formatDate(nextYear)}`;
    
    const employeeData = {
      ...createEmployeeDto,
      companyId,
      workingHours: createEmployeeDto.workingHours || '13:00 ~ 16:30',
      salary: createEmployeeDto.salary || '941,648',
      contractPeriod: createEmployeeDto.contractPeriod || defaultContractPeriod,
      sensitiveInfoConsent: createEmployeeDto.sensitiveInfoConsent ?? false,
    };

    console.log('[EmployeesService] Creating employee with data:', {
      name: employeeData.name,
      phone: employeeData.phone,
      documentUrl: employeeData.documentUrl,
      severeCertificateUrl: employeeData.severeCertificateUrl,
      hasSevereCert: !!employeeData.severeCertificateUrl,
    });

    const createdEmployee = await this.prisma.employee.create({
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

    console.log('[EmployeesService] Employee created successfully:', {
      id: createdEmployee.id,
      name: createdEmployee.name,
      documentUrl: createdEmployee.documentUrl,
      severeCertificateUrl: createdEmployee.severeCertificateUrl,
      hasSevereCert: !!createdEmployee.severeCertificateUrl,
    });

    return createdEmployee;
  }

  async findByCompany(companyId: string) {
    const employees = await this.prisma.employee.findMany({
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

    console.log('[EmployeesService] findByCompany result:', {
      companyId,
      totalEmployees: employees.length,
      employeesWithSevereCert: employees.filter(emp => emp.severeCertificateUrl).length,
      severeCertUrls: employees.map(emp => ({
        name: emp.name,
        id: emp.id,
        severeCertificateUrl: emp.severeCertificateUrl,
        hasSevereCert: !!emp.severeCertificateUrl,
      })),
    });

    return employees;
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

  // 핸드폰 번호로 근로자 조회 (모바일 앱 로그인용)
  async findByPhone(phone: string) {
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, '');

    // 다양한 형식으로 검색 시도
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { phone: phone },
          { phone: normalizedPhone },
          { phone: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
        ],
      },
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
          take: 1,
        },
      },
    });

    return employee;
  }

  // 카카오 ID로 근로자 조회 (카카오 소셜 로그인용)
  async findByKakaoId(kakaoId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        kakaoId: kakaoId,
      },
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
          take: 1,
        },
      },
    });

    return employee;
  }

  // 카카오 계정으로 회원가입 (계약서 ID 기반)
  async registerByKakao(
    accessToken: string,
    contractId: string,
  ) {
    // 1. 카카오 API로 사용자 정보 조회
    const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!kakaoResponse.ok) {
      throw new NotFoundException('카카오 인증에 실패했습니다.');
    }

    const kakaoUser = await kakaoResponse.json();
    const kakaoId = kakaoUser.id?.toString();
    const kakaoName = kakaoUser.kakao_account?.profile?.nickname || kakaoUser.kakao_account?.name || '이름 없음';
    const phoneNumber = kakaoUser.kakao_account?.phone_number?.replace(/[^0-9]/g, '');

    if (!kakaoId) {
      throw new NotFoundException('카카오 사용자 정보를 가져올 수 없습니다.');
    }

    // 2. 계약서 조회
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    // 3. 이미 카카오 ID로 등록된 근로자가 있는지 확인
    let employee = await this.findByKakaoId(kakaoId);
    
    if (employee) {
      // 이미 등록된 근로자가 있으면 그대로 반환
      return {
        employee,
        message: '이미 등록된 계정입니다.',
        isNew: false,
      };
    }

    // 4. 계약서의 employee와 카카오 계정 정보 매칭
    // 전화번호로 매칭 시도
    if (phoneNumber) {
      const existingEmployee = await this.findByPhone(phoneNumber);
      
      if (existingEmployee) {
        // 전화번호로 찾은 근로자에 카카오 ID 업데이트
        employee = await this.prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { kakaoId },
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
              take: 1,
            },
          },
        });

        return {
          employee,
          message: '카카오 계정이 연결되었습니다.',
          isNew: false,
        };
      }
    }

    // 5. 계약서의 employee와 카카오 계정 정보가 일치하는지 확인
    // 계약서의 employee 전화번호와 카카오 계정 전화번호가 일치하면 자동 매칭
    const contractEmployeePhone = contract.employee.phone.replace(/[^0-9]/g, '');
    const kakaoPhone = phoneNumber || '';

    if (contractEmployeePhone && kakaoPhone && contractEmployeePhone === kakaoPhone) {
      // 전화번호가 일치하면 계약서의 employee에 카카오 ID 업데이트
      employee = await this.prisma.employee.update({
        where: { id: contract.employee.id },
        data: { kakaoId },
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
            take: 1,
          },
        },
      });

      return {
        employee,
        message: '카카오 계정이 연결되었습니다.',
        isNew: false,
      };
    }

    // 6. 매칭되지 않으면 계약서의 employee 정보를 사용하여 새 근로자 생성
    // (계약서의 employee 정보를 기반으로 카카오 계정 정보로 업데이트)
    employee = await this.prisma.employee.update({
      where: { id: contract.employee.id },
      data: {
        kakaoId,
        // 카카오 계정 이름이 있으면 업데이트 (선택사항)
        name: kakaoName !== '이름 없음' ? kakaoName : contract.employee.name,
        // 카카오 계정 전화번호가 있으면 업데이트 (선택사항)
        phone: phoneNumber || contract.employee.phone,
      },
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
          take: 1,
        },
      },
    });

    return {
      employee,
      message: '카카오 계정으로 회원가입이 완료되었습니다.',
      isNew: true,
    };
  }
}
