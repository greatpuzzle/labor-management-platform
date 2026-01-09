import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.companiesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // 인증된 사용자의 경우 권한 체크
    if (req.user) {
      // SUPER_ADMIN은 모든 회사 조회 가능
      // COMPANY_ADMIN은 자기 회사만 조회 가능
      if (
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.companyId !== id
      ) {
        throw new ForbiddenException('You can only access your own company');
      }
    }
    // 인증되지 않은 사용자(초대 링크로 접속)는 모든 회사 정보 조회 가능

    return this.companiesService.findOne(id);
  }

  @Post(':id/invite-link')
  generateInviteLink(@Param('id') id: string, @Request() req) {
    // SUPER_ADMIN은 모든 회사의 초대 링크 생성 가능
    // COMPANY_ADMIN은 자기 회사만 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== id
    ) {
      throw new ForbiddenException(
        'You can only generate invite links for your own company',
      );
    }

    return this.companiesService.generateInviteLink(id);
  }
}
