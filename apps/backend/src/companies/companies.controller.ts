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

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // SUPER_ADMIN은 모든 회사 조회 가능
    // COMPANY_ADMIN은 자기 회사만 조회 가능
    if (
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.companyId !== id
    ) {
      throw new ForbiddenException('You can only access your own company');
    }

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
