import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { WorkSchedulesService } from './work-schedules.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard)
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  /**
   * 일주일치 업무 스케줄 생성
   * POST /api/work-schedules/:employeeId/weekly
   */
  @Post(':employeeId/weekly')
  async createWeeklySchedule(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDateStr?: string,
  ) {
    try {
      const startDate = startDateStr
        ? new Date(startDateStr)
        : new Date(); // 기본값: 오늘

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      console.log(`[WorkSchedulesController] Creating weekly schedule for employee ${employeeId}, startDate: ${startDate.toISOString()}`);
      const result = await this.workSchedulesService.createWeeklySchedule(employeeId, startDate);
      console.log(`[WorkSchedulesController] Weekly schedule created successfully for employee ${employeeId}`);
      return result;
    } catch (error: any) {
      console.error(`[WorkSchedulesController] Error creating weekly schedule for employee ${employeeId}:`, error);
      console.error(`[WorkSchedulesController] Error stack:`, error?.stack);
      console.error(`[WorkSchedulesController] Error message:`, error?.message);
      // NestJS의 HttpException이면 그대로 throw, 아니면 InternalServerErrorException으로 변환
      if (error?.status && error?.message) {
      throw error;
      }
      throw new BadRequestException(
        error?.message || `Failed to create weekly schedule: ${error}`
      );
    }
  }

  /**
   * 오늘 업무 스케줄 조회
   * GET /api/work-schedules/:employeeId/today
   */
  @Get(':employeeId/today')
  @Public() // 근로자 앱에서 인증 없이 접근 가능하도록
  async getTodaySchedule(@Param('employeeId') employeeId: string) {
    return this.workSchedulesService.getTodaySchedule(employeeId);
  }

  /**
   * 일주일치 업무 스케줄 조회
   * GET /api/work-schedules/:employeeId/weekly
   */
  @Get(':employeeId/weekly')
  @Public()
  async getWeeklySchedule(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDateStr?: string,
  ) {
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date();

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return this.workSchedulesService.getWeeklySchedule(employeeId, startDate);
  }

  /**
   * 근로자의 모든 업무 스케줄 조회
   * GET /api/work-schedules/employee/:employeeId
   */
  @Get('employee/:employeeId')
  @Public()
  async findAllByEmployee(@Param('employeeId') employeeId: string) {
    return this.workSchedulesService.findAllByEmployee(employeeId);
  }

  /**
   * 회사 전체에 대한 주간 업무 지시
   * POST /api/work-schedules/company/:companyId/weekly
   */
  @Post('company/:companyId/weekly')
  async createWeeklyScheduleForCompany(
    @Param('companyId') companyId: string,
    @Query('startDate') startDateStr?: string,
  ) {
    try {
      const startDate = startDateStr
        ? new Date(startDateStr)
        : new Date(); // 기본값: 오늘

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      console.log(`[WorkSchedulesController] Creating weekly schedule for company ${companyId}, startDate: ${startDate.toISOString()}`);
      const result = await this.workSchedulesService.createWeeklyScheduleForCompany(companyId, startDate);
      console.log(`[WorkSchedulesController] Weekly schedule created successfully for company ${companyId}`);
      return result;
    } catch (error: any) {
      console.error(`[WorkSchedulesController] Error creating weekly schedule for company ${companyId}:`, error);
      console.error(`[WorkSchedulesController] Error stack:`, error?.stack);
      console.error(`[WorkSchedulesController] Error message:`, error?.message);
      if (error?.status && error?.message) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || `Failed to create weekly schedule for company: ${error}`
      );
    }
  }

  /**
   * 업무 스케줄 삭제
   * DELETE /api/work-schedules/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workSchedulesService.remove(id);
  }
}

