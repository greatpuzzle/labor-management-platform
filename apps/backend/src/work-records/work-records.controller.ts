import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { StartWorkDto } from './dto/start-work.dto';
import { EndWorkDto } from './dto/end-work.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import type { Response as ExpressResponse } from 'express';

@Controller()
export class WorkRecordsController {
  constructor(private workRecordsService: WorkRecordsService) {}

  // 근무 시작 (근로자가 모바일 앱에서 기록 - 인증 불필요로 변경 가능)
  @Post('employees/:employeeId/work-records')
  startWork(
    @Param('employeeId') employeeId: string,
    @Body() startWorkDto: StartWorkDto,
  ) {
    return this.workRecordsService.startWork(employeeId, startWorkDto);
  }

  // 근무 종료
  @Patch('work-records/:id')
  endWork(@Param('id') id: string, @Body() endWorkDto: EndWorkDto) {
    return this.workRecordsService.endWork(id, endWorkDto);
  }

  // 직원의 근무 기록 조회
  @Get('employees/:employeeId/work-records')
  @UseGuards(JwtAuthGuard)
  async findByEmployee(
    @Param('employeeId') employeeId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Request() req?,
  ) {
    // 직원 조회하여 회사 확인
    const employee = await this.workRecordsService['prisma'].employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new ForbiddenException('Employee not found');
    }

    // SUPER_ADMIN은 모든 직원의 근무 기록 조회 가능
    // COMPANY_ADMIN은 자기 회사 직원만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== employee.companyId
    ) {
      throw new ForbiddenException(
        'You can only view work records for employees from your own company',
      );
    }

    const query: any = {};
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);

    return this.workRecordsService.findByEmployee(employeeId, query);
  }

  // 회사의 모든 근무 기록 조회
  @Get('companies/:companyId/work-records')
  @UseGuards(JwtAuthGuard)
  findByCompany(
    @Param('companyId') companyId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Request() req?,
  ) {
    // SUPER_ADMIN은 모든 회사 조회 가능
    // COMPANY_ADMIN은 자기 회사만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'You can only view work records for your own company',
      );
    }

    const query: any = {};
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);

    return this.workRecordsService.findByCompany(companyId, query);
  }

  // 엑셀 다운로드 (고용부담금 신고 양식)
  @Get('companies/:companyId/work-records/export')
  @UseGuards(JwtAuthGuard)
  async exportToExcel(
    @Param('companyId') companyId: string,
    @Query('year') year: string,
    @Response() res: ExpressResponse,
    @Request() req?,
  ) {
    // SUPER_ADMIN은 모든 회사 조회 가능
    // COMPANY_ADMIN은 자기 회사만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'You can only export work records for your own company',
      );
    }

    const exportYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const buffer = await this.workRecordsService.exportToExcel(
      companyId,
      exportYear,
    );

    const filename = `고용부담금_신고_${exportYear}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  }
}
