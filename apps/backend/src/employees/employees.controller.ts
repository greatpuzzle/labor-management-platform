import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  // 근로자가 초대 링크로 직접 등록 (인증 불필요)
  @Post('companies/:companyId/employees')
  create(
    @Param('companyId') companyId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(companyId, createEmployeeDto);
  }

  // 회사의 모든 직원 조회
  @Get('companies/:companyId/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByCompany(@Param('companyId') companyId: string, @Request() req) {
    // SUPER_ADMIN은 모든 회사의 직원 조회 가능
    // COMPANY_ADMIN은 자기 회사만 조회 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'You can only access employees from your own company',
      );
    }

    return this.employeesService.findByCompany(companyId);
  }

  // 특정 직원 상세 조회
  // 인증된 사용자는 권한 체크, 미인증 사용자(근로자)는 자신의 정보만 조회 가능
  @Get('employees/:id')
  @Public()
  async findOne(@Param('id') id: string, @Request() req) {
    const employee = await this.employeesService.findOne(id);

    // 인증된 사용자인 경우 권한 체크
    if (req.user) {
      // SUPER_ADMIN은 모든 직원 조회 가능
      // COMPANY_ADMIN은 자기 회사 직원만 조회 가능
      if (
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.companyId !== employee.companyId
      ) {
        throw new ForbiddenException(
          'You can only access employees from your own company',
        );
      }
    }
    // 인증되지 않은 사용자(근로자)는 자신의 정보 조회 가능 (모바일 앱에서 사용)

    return employee;
  }

  // 직원 정보 수정 (어드민이 근로 조건 등록)
  @Patch('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Request() req,
  ) {
    const employee = await this.employeesService.findOne(id);

    // SUPER_ADMIN은 모든 직원 수정 가능
    // COMPANY_ADMIN은 자기 회사 직원만 수정 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== employee.companyId
    ) {
      throw new ForbiddenException(
        'You can only update employees from your own company',
      );
    }

    return this.employeesService.update(id, updateEmployeeDto);
  }

  // 직원 삭제 (SUPER_ADMIN 또는 자기 회사 COMPANY_ADMIN)
  @Delete('employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const employee = await this.employeesService.findOne(id);

    // SUPER_ADMIN은 모든 직원 삭제 가능
    // COMPANY_ADMIN은 자기 회사 직원만 삭제 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== employee.companyId
    ) {
      throw new ForbiddenException(
        'You can only delete employees from your own company',
      );
    }

    return this.employeesService.remove(id);
  }

  // 핸드폰 번호로 근로자 로그인 (모바일 앱에서 사용, 본인인증 CI 필수)
  @Post('employees/login-by-phone')
  @Public()
  async loginByPhone(@Body() body: { phone: string; ci: string }) {
    // 테스트 전화번호는 CI 검증 완화
    const normalizedPhone = body.phone.replace(/\D/g, '');
    const isTestPhone = normalizedPhone === '01012341234';
    
    if (!isTestPhone && !body.ci) {
      throw new ForbiddenException('본인인증이 필요합니다.');
    }

    const employee = await this.employeesService.findByPhone(body.phone);

    if (!employee) {
      throw new NotFoundException(
        '등록된 정보가 없습니다. 회사의 초대 링크를 통해 먼저 등록해주세요.',
      );
    }

    // 테스트 전화번호는 CI 검증 건너뛰기
    if (!isTestPhone) {
      // 본인인증 CI 검증 (CI가 저장되어 있는 경우에만 검증)
      const employeeCi = (employee as any).ci;
      if (employeeCi) {
        if (employeeCi !== body.ci) {
          throw new ForbiddenException('본인인증 정보가 일치하지 않습니다.');
        }
      } else {
        // 기존 근로자 중 CI가 없는 경우, CI를 저장 (점진적 마이그레이션)
        await this.employeesService.update(employee.id, { ci: body.ci } as any);
      }
    } else {
      // 테스트 전화번호는 CI 저장 (테스트용)
      if (body.ci) {
        await this.employeesService.update(employee.id, { ci: body.ci } as any);
      }
    }

    return {
      employee: {
        ...employee,
        ci: body.ci || (employee as any).ci, // CI 포함
      } as any,
      message: '로그인 성공',
    };
  }

  // 카카오 계정으로 회원가입 (계약서 ID 기반)
  @Post('employees/register-by-kakao')
  @Public()
  async registerByKakao(@Body() body: { accessToken: string; contractId: string }) {
    if (!body.accessToken) {
      throw new ForbiddenException('카카오 액세스 토큰이 필요합니다.');
    }

    if (!body.contractId) {
      throw new ForbiddenException('계약서 ID가 필요합니다.');
    }

    try {
      const result = await this.employeesService.registerByKakao(
        body.accessToken,
        body.contractId,
      );

      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('[EmployeesController] Kakao registration failed:', error);
      throw new ForbiddenException('카카오 회원가입에 실패했습니다.');
    }
  }

  // 카카오 소셜 로그인 (모바일 앱에서 사용)
  @Post('employees/login-by-kakao')
  @Public()
  async loginByKakao(@Body() body: { accessToken: string }) {
    if (!body.accessToken) {
      throw new ForbiddenException('카카오 액세스 토큰이 필요합니다.');
    }

    try {
      // 카카오 API로 사용자 정보 조회
      const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${body.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      if (!kakaoResponse.ok) {
        throw new ForbiddenException('카카오 인증에 실패했습니다.');
      }

      const kakaoUser = await kakaoResponse.json();
      const kakaoId = kakaoUser.id?.toString();
      const phoneNumber = kakaoUser.kakao_account?.phone_number?.replace(/[^0-9]/g, '');

      if (!kakaoId) {
        throw new ForbiddenException('카카오 사용자 정보를 가져올 수 없습니다.');
      }

      // 카카오 ID로 근로자 조회
      let employee = await this.employeesService.findByKakaoId(kakaoId);

      // 카카오 ID로 찾지 못했고 전화번호가 있으면 전화번호로 조회
      if (!employee && phoneNumber) {
        employee = await this.employeesService.findByPhone(phoneNumber);
        
        // 전화번호로 찾았으면 카카오 ID 업데이트
        if (employee) {
          await this.employeesService.update(employee.id, { kakaoId } as any);
        }
      }

      if (!employee) {
        throw new NotFoundException(
          '등록된 정보가 없습니다. 회사의 초대 링크를 통해 먼저 등록해주세요.',
        );
      }

      return {
        employee,
        message: '로그인 성공',
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('[EmployeesController] Kakao login failed:', error);
      throw new ForbiddenException('카카오 로그인에 실패했습니다.');
    }
  }
}
