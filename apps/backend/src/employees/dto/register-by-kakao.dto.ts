import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterByKakaoDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  contractId: string;
}
