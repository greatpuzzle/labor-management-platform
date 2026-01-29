import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';

@Injectable()
export class VerificationService {
  private readonly portOneApiUrl: string;
  private readonly portOneApiSecret: string;
  private readonly channelKey: string;
  private readonly storeId: string;

  constructor(private configService: ConfigService) {
    // 포트원 API 설정 (환경 변수에서 가져오기)
    this.portOneApiUrl = this.configService.get<string>('PORTONE_API_URL') || 'https://api.portone.io';
    this.portOneApiSecret = this.configService.get<string>('PORTONE_API_SECRET') || '';
    this.channelKey = this.configService.get<string>('PORTONE_CHANNEL_KEY') || '';
    this.storeId = this.configService.get<string>('PORTONE_STORE_ID') || '';
  }

  /**
   * 포트원 본인인증 요청 (인증번호 발송)
   * @param phone 핸드폰 번호
   * @param clientIp 클라이언트 IP 주소
   * @returns 인증 요청 결과 (identityVerificationId 등)
   */
  async requestVerification(phone: string, clientIp?: string): Promise<{ identityVerificationId: string; message: string }> {
    try {
      // 1. 본인인증 ID를 가맹점에서 직접 생성 (UUID)
      const identityVerificationId = `iv-${randomUUID()}`;

      // 2. 본인인증 요청 전송 (SMS)
      const normalizedPhone = phone.replace(/\D/g, ''); // 숫자만 추출

      // 클라이언트 IP 주소
      const ipAddress = clientIp || '127.0.0.1';

      console.log('[VerificationService] Sending verification request:', {
        identityVerificationId,
        phone: normalizedPhone,
        channelKey: this.channelKey,
        storeId: this.storeId,
      });

      // 요청 본문 구성
      const requestBody: any = {
        channelKey: this.channelKey,
        customer: {
          name: '', // 본인인증 요청 단계에서는 이름을 모르므로 빈 문자열
          phoneNumber: normalizedPhone,
        },
        method: 'SMS', // SMS 방식으로 본인인증 요청
        operator: 'SKT', // 통신사 (010 번호는 통신사 구분 불가하므로 기본값으로 SKT 사용)
      };

      // storeId가 있으면 추가
      if (this.storeId) {
        requestBody.storeId = this.storeId;
      }

      const sendResponse = await axios.post(
        `${this.portOneApiUrl}/identity-verifications/${identityVerificationId}/send`,
        requestBody,
        {
          headers: {
            'Authorization': `PortOne ${this.portOneApiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[VerificationService] Send response:', sendResponse.data);

      return {
        identityVerificationId,
        message: '인증번호가 발송되었습니다.',
      };
    } catch (error: any) {
      console.error('[VerificationService] Request verification failed:', error);
      console.error('[VerificationService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.data) {
        const errorMessage = error.response.data.message || error.response.data.type || JSON.stringify(error.response.data) || '인증번호 발송에 실패했습니다.';
        throw new BadRequestException(errorMessage);
      }
      throw new BadRequestException(`인증번호 발송에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 포트원 본인인증 확인 (인증번호 검증)
   * @param identityVerificationId 본인인증 ID
   * @param code 사용자가 입력한 인증번호 (OTP)
   * @returns 인증 결과 (이름, 생년월일 등)
   */
  async verifyCode(identityVerificationId: string, code: string): Promise<{
    name: string;
    birthDate: string;
    phone: string;
    ci: string; // 본인인증 고유값
  }> {
    try {
      // 본인인증 확인 (OTP 검증)
      const response = await axios.post(
        `${this.portOneApiUrl}/identity-verifications/${identityVerificationId}/confirm`,
        {
          otp: code,
        },
        {
          headers: {
            'Authorization': `PortOne ${this.portOneApiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const verifiedCustomer = response.data.identityVerification?.verifiedCustomer;
      if (!verifiedCustomer) {
        throw new BadRequestException('본인인증 확인에 실패했습니다.');
      }

      return {
        name: verifiedCustomer.name || '',
        birthDate: verifiedCustomer.birthDate || '',
        phone: verifiedCustomer.phoneNumber || '',
        ci: verifiedCustomer.ci || '',
      };
    } catch (error: any) {
      console.error('[VerificationService] Verify code failed:', error);
      if (error.response?.data) {
        const errorMessage = error.response.data.message || error.response.data.type || '인증번호가 올바르지 않습니다.';
        throw new BadRequestException(errorMessage);
      }
      throw new BadRequestException('인증번호 확인에 실패했습니다.');
    }
  }
}
