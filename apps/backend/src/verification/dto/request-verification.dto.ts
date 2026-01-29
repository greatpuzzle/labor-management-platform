import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class RequestVerificationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(01[0-9]-\d{3,4}-\d{4}|01[0-9]\d{7,8}|\d{10,11})$/, {
    message: '올바른 핸드폰 번호를 입력해주세요.',
  })
  phone: string;
}
