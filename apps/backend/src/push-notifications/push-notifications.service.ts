import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

@Injectable()
export class PushNotificationsService {
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  /**
   * Firebase Admin SDK 초기화
   */
  private initializeFirebase() {
    try {
      // Firebase Admin SDK 초기화
      // 환경 변수에서 설정을 가져옴
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      if (serviceAccountPath) {
        // JSON 파일 경로로 초기화
        try {
          const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
          const serviceAccount = JSON.parse(serviceAccountJson);
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[PushNotifications] Firebase initialized from file:', serviceAccountPath);
        } catch (error) {
          console.error('[PushNotifications] Failed to read service account file:', error);
        }
      } else if (serviceAccountJson) {
        // JSON 문자열로 초기화
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[PushNotifications] Firebase initialized from environment variable');
        } catch (error) {
          console.error('[PushNotifications] Failed to parse service account JSON:', error);
        }
      } else {
        console.warn('[PushNotifications] Firebase credentials not configured. Push notifications will be mocked.');
        console.warn('[PushNotifications] Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable push notifications.');
      }
    } catch (error) {
      console.error('[PushNotifications] Failed to initialize Firebase:', error);
      console.warn('[PushNotifications] Push notifications will be mocked.');
    }
  }

  /**
   * Push Notification 토큰 등록
   */
  async registerToken(employeeId: string, token: string, platform: 'android' | 'ios'): Promise<void> {
    // 근로자 존재 확인
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // 토큰 등록 또는 업데이트
    await this.prisma.pushNotificationToken.upsert({
      where: { employeeId },
      create: {
        employeeId,
        token,
        platform,
      },
      update: {
        token,
        platform,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Push Notification 토큰 해제
   */
  async unregisterToken(employeeId: string): Promise<void> {
    await this.prisma.pushNotificationToken.deleteMany({
      where: { employeeId },
    });
  }

  /**
   * 근로자에게 Push Notification 전송
   */
  async sendNotification(
    employeeId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // 토큰 조회
    const tokenRecord = await this.prisma.pushNotificationToken.findUnique({
      where: { employeeId },
      include: { employee: true },
    });

    if (!tokenRecord) {
      console.warn(`[PushNotifications] No push token found for employee ${employeeId}`);
      return;
    }

    // Firebase Admin SDK를 사용하여 알림 전송
    if (this.firebaseApp) {
      try {
        const message: admin.messaging.Message = {
          token: tokenRecord.token,
          notification: {
            title,
            body,
          },
          data: data ? this.stringifyData(data) : undefined,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        const response = await admin.messaging(this.firebaseApp).send(message);
        console.log(`[PushNotifications] Successfully sent message: ${response}`);
      } catch (error: any) {
        console.error('[PushNotifications] Failed to send notification:', error);
        
        // 토큰이 유효하지 않은 경우 삭제
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          await this.unregisterToken(employeeId);
        }
        
        throw error;
      }
    } else {
      // Mock 모드: 로그만 출력
      console.log('[PushNotifications] MOCK - Notification would be sent:', {
        employeeId,
        employeeName: tokenRecord.employee.name,
        token: tokenRecord.token.substring(0, 20) + '...',
        platform: tokenRecord.platform,
        title,
        body,
        data,
      });
    }
  }

  /**
   * 일주일치 업무 스케줄 생성 시 자동으로 Push Notification 전송
   * 실제 운영에서는 cron job이나 스케줄러에서 매일 오전 9시에 호출되어야 함
   */
  async scheduleDailyWorkNotifications(employeeId: string, targetDate?: Date): Promise<void> {
    // targetDate가 제공되면 해당 날짜, 없으면 오늘 날짜 사용
    const date = targetDate || new Date();
    date.setHours(0, 0, 0, 0);
    
    // 해당 날짜 업무 스케줄 조회
    // Prisma Date 타입은 JavaScript Date 객체로 변환되므로 직접 사용 가능
    const schedule = await this.prisma.workSchedule.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: date, // Prisma Date 타입은 JavaScript Date 객체로 자동 변환됨
        },
      },
      include: {
        employee: {
          include: {
            company: true,
          },
        },
      },
    });

    if (schedule && schedule.tasks.length > 0) {
      const taskCount = schedule.tasks.length;
      const taskList = schedule.tasks.slice(0, 3).join(', '); // 최대 3개만 표시
      const companyName = schedule.employee?.company?.name || '회사';
      const title = `[${companyName}] 오늘 예정된 업무`;
      const body = `오늘 예정된 업무가 ${taskCount}건 있습니다. (${taskList}${taskCount > 3 ? '...' : ''})`;

      await this.sendNotification(employeeId, title, body, {
        type: 'daily_schedule',
        date: date.toISOString().split('T')[0],
      });
    } else {
      console.log(`[PushNotifications] No schedule found for employee ${employeeId} on ${date.toISOString().split('T')[0]}`);
    }
  }

  /**
   * 데이터를 문자열로 변환 (Firebase FCM은 모든 데이터를 문자열로 요구)
   */
  private stringifyData(data: Record<string, any>): Record<string, string> {
    const stringData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return stringData;
  }
}

