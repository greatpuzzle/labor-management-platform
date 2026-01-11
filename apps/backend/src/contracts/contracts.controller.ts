import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { SendContractDto } from './dto/send-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller()
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  // 계약서 발송 (어드민이 근로 조건 입력 후 발송)
  @Post('employees/:employeeId/contracts/send')
  @UseGuards(JwtAuthGuard)
  async sendContract(
    @Param('employeeId') employeeId: string,
    @Body() sendContractDto: SendContractDto,
    @Request() req,
  ) {
    // 직원 조회하여 회사 확인
    const employee = await this.contractsService['prisma'].employee.findUnique(
      {
        where: { id: employeeId },
      },
    );

    if (!employee) {
      throw new ForbiddenException('Employee not found');
    }

    // SUPER_ADMIN은 모든 직원의 계약서 발송 가능
    // COMPANY_ADMIN은 자기 회사 직원만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== employee.companyId
    ) {
      throw new ForbiddenException(
        'You can only send contracts for employees from your own company',
      );
    }

    return this.contractsService.sendContract(
      employeeId,
      sendContractDto,
      req.user.id,
    );
  }

  // 계약서 서명 (근로자가 모바일 앱에서 서명 - 인증 불필요)
  @Post('contracts/:contractId/sign')
  signContract(
    @Param('contractId') contractId: string,
    @Body() signContractDto: SignContractDto,
  ) {
    return this.contractsService.signContract(contractId, signContractDto);
  }

  // 직원의 모든 계약서 조회
  @Get('employees/:employeeId/contracts')
  @UseGuards(JwtAuthGuard)
  async findByEmployee(@Param('employeeId') employeeId: string, @Request() req) {
    // 직원 조회하여 회사 확인
    const employee = await this.contractsService['prisma'].employee.findUnique(
      {
        where: { id: employeeId },
      },
    );

    if (!employee) {
      throw new ForbiddenException('Employee not found');
    }

    // SUPER_ADMIN은 모든 직원의 계약서 조회 가능
    // COMPANY_ADMIN은 자기 회사 직원만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== employee.companyId
    ) {
      throw new ForbiddenException(
        'You can only view contracts for employees from your own company',
      );
    }

    return this.contractsService.findByEmployee(employeeId);
  }

  // 특정 계약서 조회
  @Get('contracts/:id')
  findOne(@Param('id') id: string) {
    // 인증 불필요 - 근로자가 카카오톡 링크로 접근 가능해야 함
    return this.contractsService.findOne(id);
  }
}
