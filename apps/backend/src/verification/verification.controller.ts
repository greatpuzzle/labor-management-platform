import { Controller, Post, Body, Request } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('verification')
@Public()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * 본인인증 요청 (인증번호 발송)
   * POST /api/verification/request
   */
  @Post('request')
  async requestVerification(@Body() dto: RequestVerificationDto, @Request() req: any) {
    // 클라이언트 IP 주소 가져오기
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('[VerificationController] Request verification:', { phone: dto.phone, clientIp });
    try {
      const result = await this.verificationService.requestVerification(dto.phone, clientIp);
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      console.error('[VerificationController] Error:', error);
      throw error;
    }
  }

  /**
   * 본인인증 확인 (인증번호 검증)
   * POST /api/verification/verify
   */
  @Post('verify')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const result = await this.verificationService.verifyCode(dto.identityVerificationId, dto.code);
    return {
      success: true,
      ...result,
    };
  }
}
