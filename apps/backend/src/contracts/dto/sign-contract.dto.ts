import { IsString, IsNotEmpty } from 'class-validator';

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  signatureBase64: string;

  @IsString()
  @IsNotEmpty()
  pdfBase64: string;
}
