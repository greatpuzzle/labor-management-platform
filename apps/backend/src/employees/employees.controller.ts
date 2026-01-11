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
}
