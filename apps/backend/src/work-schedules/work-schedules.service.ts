import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

// 업무 종류 목록
const TASK_TYPES = [
  '페트병 수거기기 작동 확인',
  '분쇄 페트 저장량 확인',
  '기기 페트병 투입',
  '현장 점검',
  'AI 데이터 모니터링',
  '자원 순환 상태 확인',
  'AI 관제',
];

@Injectable()
export class WorkSchedulesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PushNotificationsService))
    private pushNotificationsService: PushNotificationsService,
  ) {}

  /**
   * 랜덤으로 4개의 업무 선택
   */
  private getRandomTasks(count: number = 4): string[] {
    const shuffled = [...TASK_TYPES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * 일주일치 업무 스케줄 생성 (매일 4개씩 랜덤)
   */
  async createWeeklySchedule(employeeId: string, startDate: Date) {
    try {
      console.log(`[WorkSchedulesService] createWeeklySchedule called for employee ${employeeId}, startDate: ${startDate.toISOString()}`);
      
      // 근로자 존재 확인
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        console.error(`[WorkSchedulesService] Employee ${employeeId} not found`);
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      console.log(`[WorkSchedulesService] Employee found: ${employee.name}`);

      // startDate의 시간 정보 제거 (날짜만 사용)
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      console.log(`[WorkSchedulesService] Normalized startDate: ${normalizedStartDate.toISOString()}`);

    // 일주일치 날짜 생성 (7일)
    const schedules: Array<{
      id: string;
      employeeId: string;
      date: Date;
      tasks: string[];
      createdAt: Date;
      updatedAt: Date;
    }> = [];
    const endDate = new Date(normalizedStartDate);
    endDate.setDate(endDate.getDate() + 6);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(normalizedStartDate);
      currentDate.setDate(currentDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0); // @db.Date 필드는 날짜만 저장하므로 시간 정보 제거
      
      // 해당 날짜에 이미 스케줄이 있는지 확인
      const existingSchedule = await this.prisma.workSchedule.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: currentDate,
          },
        },
      });

      if (existingSchedule) {
        // 이미 있으면 업데이트
        const updated = await this.prisma.workSchedule.update({
          where: { id: existingSchedule.id },
          data: {
            tasks: this.getRandomTasks(),
          },
        });
        schedules.push(updated);
      } else {
        // 없으면 생성
        const created = await this.prisma.workSchedule.create({
          data: {
            employeeId,
            date: currentDate,
            tasks: this.getRandomTasks(),
          },
        });
        schedules.push(created);
      }
    }

    // 일주일치 업무 스케줄 생성 완료 후, 오늘 날짜에 대해 Push Notification 전송 시도
    // (실제로는 cron job이나 스케줄러에서 매일 오전 9시에 호출해야 함)
    // 여기서는 스케줄 생성 시 오늘 날짜에 대한 알림만 즉시 전송
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySchedule = schedules.find(s => {
        const scheduleDate = new Date(s.date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === today.getTime();
      });
      
      if (todaySchedule) {
        // 오늘 업무가 있으면 Push Notification 전송 (비동기, 실패해도 스케줄 생성은 성공)
        this.pushNotificationsService.scheduleDailyWorkNotifications(employeeId, today)
          .catch(error => {
            console.error('[WorkSchedules] Failed to send push notification:', error);
          });
      }
    } catch (error) {
      console.error('[WorkSchedules] Error in push notification scheduling:', error);
    }

    return schedules;
  }

  /**
   * 근로자의 특정 날짜 업무 스케줄 조회
   */
  async getScheduleByDate(employeeId: string, date: Date) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
    });

    return schedule;
  }

  /**
   * 근로자의 오늘 업무 스케줄 조회
   */
  async getTodaySchedule(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getScheduleByDate(employeeId, today);
  }

  /**
   * 근로자의 일주일치 업무 스케줄 조회
   */
  async getWeeklySchedule(employeeId: string, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const schedules = await this.prisma.workSchedule.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return schedules;
  }

  /**
   * 근로자의 모든 업무 스케줄 조회
   */
  async findAllByEmployee(employeeId: string) {
    return this.prisma.workSchedule.findMany({
      where: { employeeId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * 업무 스케줄 삭제
   */
  async remove(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    return this.prisma.workSchedule.delete({
      where: { id },
    });
  }
}

