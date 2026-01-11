import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees/:employeeId')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  /**
   * Push Notification 토큰 등록
   * POST /api/employees/:employeeId/push-token
   */
  @Post('push-token')
  @Public() // 근로자 앱에서 인증 없이 접근 가능하도록
  async registerToken(
    @Param('employeeId') employeeId: string,
    @Body() registerTokenDto: RegisterTokenDto,
  ) {
    await this.pushNotificationsService.registerToken(
      employeeId,
      registerTokenDto.token,
      registerTokenDto.platform,
    );
    return { message: 'Token registered successfully' };
  }

  /**
   * Push Notification 토큰 해제
   * DELETE /api/employees/:employeeId/push-token
   */
  @Delete('push-token')
  @Public()
  async unregisterToken(@Param('employeeId') employeeId: string) {
    await this.pushNotificationsService.unregisterToken(employeeId);
    return { message: 'Token unregistered successfully' };
  }

  /**
   * Push Notification 전송 (관리자용)
   * POST /api/employees/:employeeId/push-notification
   */
  @Post('push-notification')
  async sendNotification(
    @Param('employeeId') employeeId: string,
    @Body() sendNotificationDto: SendNotificationDto,
  ) {
    await this.pushNotificationsService.sendNotification(
      employeeId,
      sendNotificationDto.title,
      sendNotificationDto.body,
      sendNotificationDto.data,
    );
    return { message: 'Notification sent successfully' };
  }
}

