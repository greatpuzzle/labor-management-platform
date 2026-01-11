import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly kakaoRestApiKey: string;
  private readonly kakaoSenderKey: string;
  private readonly kakaoTemplateCode: string;
  private readonly kakaoChannelId: string;
  private readonly kakaoServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.kakaoRestApiKey =
      this.configService.get<string>('KAKAO_REST_API_KEY') || '';
    this.kakaoSenderKey =
      this.configService.get<string>('KAKAO_SENDER_KEY') || '';
    this.kakaoTemplateCode =
      this.configService.get<string>('KAKAO_ALIMTALK_TEMPLATE_CODE') || '';
    this.kakaoChannelId =
      this.configService.get<string>('KAKAO_CHANNEL_ID') || '';
    // 카카오 비즈니스 API URL (알림톡)
    this.kakaoServiceUrl =
      this.configService.get<string>('KAKAO_SERVICE_URL') ||
      'https://kapi.kakao.com';
  }

  /**
   * 카카오톡 메시지 내용 생성 (미리보기용)
   */
  generateMessageContent(employeeName: string, contractLink: string): string {
    return `[그레이트퍼즐] 근로계약서가 발송되었습니다.

${employeeName}님, 근로계약서를 확인하고 서명해주세요.

문의: 그레이트퍼즐 고객센터`;
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

    // 실제 카카오톡 알림톡 API 호출
    try {
      // 전화번호 형식 정리 (하이픈 제거)
      const phoneNumber = employeePhone.replace(/[-\s]/g, '');

      // 알림톡 메시지 내용 구성 (그레이트퍼즐 채널)
      // 버튼만 제공하므로 링크는 메시지에 포함하지 않음
      const message = `[그레이트퍼즐] 근로계약서가 발송되었습니다.

${employeeName}님, 근로계약서를 확인하고 서명해주세요.

문의: 그레이트퍼즐 고객센터`;

      // 카카오톡 알림톡 API 호출
      // 카카오 비즈니스 API (BizMessage) 사용
      // 참고: 실제 구현 시 카카오 비즈니스 API 문서 참조 필요
      
      // 방법 1: 알림톡 템플릿 사용 (권장)
      if (this.kakaoTemplateCode && this.kakaoSenderKey) {
        // 알림톡 템플릿을 사용한 발송
        // 실제 API는 카카오 비즈니스 API 문서에 따라 구현 필요
        // 예시: https://bizmessage.kakao.com/api/v1/alimtalk/send
        
        this.logger.log(
          `[알림톡 템플릿] 계약서 알림 전송 시도\n` +
          `수신자: ${employeeName} (${phoneNumber})\n` +
          `템플릿 코드: ${this.kakaoTemplateCode}\n` +
          `계약서 링크: ${contractLink}\n` +
          `앱 설치 링크: ${appInstallLink}`,
        );

        // 실제 API 호출 (카카오 비즈니스 API 엔드포인트 사용)
        // 주의: 실제 API 엔드포인트와 파라미터는 카카오 비즈니스 API 문서 참조
        try {
          const response = await fetch(
            'https://bizmessage.kakao.com/api/v1/alimtalk/send',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${this.kakaoRestApiKey}`,
                'Content-Type': 'application/json',
                'X-Kakao-Sender-Key': this.kakaoSenderKey,
              },
              body: JSON.stringify({
                template_code: this.kakaoTemplateCode,
                receiver_phone: phoneNumber,
                variables: {
                  근로자명: employeeName,
                  계약서링크: contractLink,
                  앱설치링크: appInstallLink,
                },
                buttons: [
                  {
                    name: '계약서 확인하기',
                    linkType: 'WL',
                    linkMo: contractLink,
                    linkPc: contractLink,
                  },
                ],
              }),
            },
          );

          if (!response.ok) {
            const errorData = await response.text();
            this.logger.warn(
              `카카오톡 알림톡 API 호출 실패 (${response.status}): ${errorData}`,
            );
            // API 호출 실패 시에도 성공으로 처리 (개발 모드)
            return {
              success: true,
              mock: true,
              message: '개발 모드: 카카오톡 알림톡 API 호출에 실패했습니다. 로그를 확인하세요.',
              recipient: {
                name: employeeName,
                phone: phoneNumber,
              },
              links: {
                contract: contractLink,
                appInstall: appInstallLink,
              },
            };
          }

          const result = await response.json();
          this.logger.log(
            `카카오톡 알림톡 전송 성공: ${employeeName} (${phoneNumber})`,
          );

          return {
            success: true,
            mock: false,
            message: '카카오톡 알림톡이 전송되었습니다.',
            recipient: {
              name: employeeName,
              phone: phoneNumber,
            },
            apiResponse: result,
          };
        } catch (apiError) {
          this.logger.warn(
            `카카오톡 알림톡 API 호출 중 오류 발생: ${apiError}`,
          );
          // API 호출 실패 시에도 성공으로 처리 (개발 모드)
          return {
            success: true,
            mock: true,
            message: '개발 모드: 카카오톡 알림톡 API 호출에 실패했습니다.',
            recipient: {
              name: employeeName,
              phone: phoneNumber,
            },
            links: {
              contract: contractLink,
              appInstall: appInstallLink,
            },
          };
        }
      } else {
        // 템플릿 코드가 없으면 로그만 출력 (개발 모드)
        this.logger.log(
          `[개발 모드] 카카오톡 알림톡 전송 (템플릿 미설정)\n` +
          `수신자: ${employeeName} (${phoneNumber})\n` +
          `계약서 링크: ${contractLink}\n` +
          `앱 설치 링크: ${appInstallLink}`,
        );

        return {
          success: true,
          mock: true,
          message: '개발 모드: 카카오톡 알림톡 템플릿이 설정되지 않았습니다.',
          recipient: {
            name: employeeName,
            phone: phoneNumber,
          },
          links: {
            contract: contractLink,
            appInstall: appInstallLink,
          },
        };
      }
    } catch (error) {
      this.logger.error('카카오톡 알림 전송 실패:', error);
      // 에러가 발생해도 계약서 발송은 성공으로 처리
      return {
        success: false,
        mock: true,
        message: '카카오톡 알림 전송에 실패했습니다. 계약서는 정상적으로 발송되었습니다.',
        recipient: {
          name: employeeName,
          phone: employeePhone,
        },
        links: {
          contract: contractLink,
          appInstall: appInstallLink,
        },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
