import { Controller, Get, Query, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PreviewMessageDto } from './dto/preview-message.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 카카오톡 메시지 미리보기 (테스트용)
   * 실제 메시지를 전송하지 않고 메시지 내용을 반환합니다.
   */
  @Get('preview')
  async previewMessage(
    @Query('employeeName') employeeName: string = '홍길동',
    @Query('employeePhone') employeePhone: string = '010-1234-5678',
    @Query('contractId') contractId?: string,
  ) {
    const mobileAppUrl = process.env.MOBILE_APP_URL || 'http://192.168.45.78:5174';
    const contractLink = contractId 
      ? `${mobileAppUrl}/contract/${contractId}`
      : `${mobileAppUrl}/contract/test-contract-id`;
    const appInstallLink = `${mobileAppUrl}/download.html?redirect=${encodeURIComponent(contractLink)}`;

    const message = this.notificationsService.generateMessageContent(
      employeeName,
      contractLink,
    );

    return {
      mock: true,
      message: '카카오톡 메시지 미리보기 (실제 전송되지 않음)',
      recipient: {
        name: employeeName,
        phone: employeePhone,
      },
      kakaoTalkMessage: {
        template: '[그레이트퍼즐] 근로계약서가 발송되었습니다.',
        content: message,
        buttons: [
          {
            name: '계약서 확인하기',
            linkType: 'WL',
            linkMo: contractLink,
            linkPc: contractLink,
          },
        ],
      },
      links: {
        contract: contractLink,
        appInstall: appInstallLink,
      },
      preview: {
        formattedMessage: message,
        contractLink,
        appInstallLink,
      },
    };
  }

  /**
   * 카카오톡 메시지 테스트 (Mock 전송)
   * 실제로는 전송하지 않고 로그만 출력합니다.
   */
  @Post('test')
  @UsePipes(new ValidationPipe({ transform: true }))
  async testMessage(@Body() body: PreviewMessageDto) {
    const { employeeName, employeePhone, contractId } = body;
    const mobileAppUrl = process.env.MOBILE_APP_URL || 'http://192.168.45.78:5174';
    const contractLink = contractId 
      ? `${mobileAppUrl}/contract/${contractId}`
      : `${mobileAppUrl}/contract/test-contract-id`;
    const appInstallLink = `${mobileAppUrl}/download.html?redirect=${encodeURIComponent(contractLink)}`;

    // Mock 전송 (실제 전송하지 않음)
    const result = await this.notificationsService.sendContractNotification(
      employeeName,
      employeePhone,
      contractLink,
      appInstallLink,
    );

    return {
      ...result,
      testMode: true,
      message: '테스트 모드: 실제 카카오톡 메시지는 전송되지 않았습니다. 백엔드 로그를 확인하세요.',
    };
  }
}

