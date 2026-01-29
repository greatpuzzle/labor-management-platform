import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  identityVerificationId: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
