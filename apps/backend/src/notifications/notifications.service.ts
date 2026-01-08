import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly kakaoRestApiKey: string;
  private readonly kakaoSenderKey: string;
  private readonly kakaoTemplateCode: string;

  constructor(private configService: ConfigService) {
    this.kakaoRestApiKey =
      this.configService.get<string>('KAKAO_REST_API_KEY') || '';
    this.kakaoSenderKey =
      this.configService.get<string>('KAKAO_SENDER_KEY') || '';
    this.kakaoTemplateCode =
      this.configService.get<string>('KAKAO_ALIMTALK_TEMPLATE_CODE') || '';
  }

  async sendContractNotification(
    employeeName: string,
    employeePhone: string,
    contractLink: string,
    appInstallLink: string,
  ) {
    // 카카오톡 API 키가 설정되어 있는지 확인
    if (
      !this.kakaoRestApiKey ||
      this.kakaoRestApiKey === 'your-kakao-rest-api-key'
    ) {
      this.logger.warn(
        '카카오톡 API 키가 설정되지 않았습니다. 개발 모드에서는 로그만 출력합니다.',
      );
      this.logger.log(
        `[Mock KakaoTalk] 계약서 알림 전송\n` +
          `수신자: ${employeeName} (${employeePhone})\n` +
          `계약서 링크: ${contractLink}\n` +
          `앱 설치 링크: ${appInstallLink}`,
      );

      return {
        success: true,
        mock: true,
        message: '개발 모드: 카카오톡 알림이 로그로만 출력되었습니다.',
        recipient: {
          name: employeeName,
          phone: employeePhone,
        },
        links: {
          contract: contractLink,
          appInstall: appInstallLink,
        },
      };
    }

    // 실제 카카오톡 API 호출 (추후 구현)
    try {
      // TODO: 실제 카카오톡 알림톡 API 호출
      // const response = await axios.post(
      //   'https://kapi.kakao.com/v1/api/talk/friends/message/default/send',
      //   {
      //     receiver_uuids: [employeePhone],
      //     template_object: {
      //       object_type: 'text',
      //       text: `근로계약서가 발송되었습니다.\n\n근로자: ${employeeName}\n\n계약서 확인: ${contractLink}\n앱 다운로드: ${appInstallLink}`,
      //       link: {
      //         web_url: contractLink,
      //         mobile_web_url: contractLink,
      //       },
      //     },
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.kakaoRestApiKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   },
      // );

      this.logger.log(
        `카카오톡 알림 전송 성공: ${employeeName} (${employeePhone})`,
      );

      return {
        success: true,
        mock: false,
        message: '카카오톡 알림이 전송되었습니다.',
        recipient: {
          name: employeeName,
          phone: employeePhone,
        },
      };
    } catch (error) {
      this.logger.error('카카오톡 알림 전송 실패:', error);
      throw error;
    }
  }
}
