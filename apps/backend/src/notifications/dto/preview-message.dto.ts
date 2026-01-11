import { IsString, IsOptional } from 'class-validator';

export class PreviewMessageDto {
  @IsString()
  employeeName: string;

  @IsString()
  employeePhone: string;

  @IsOptional()
  @IsString()
  contractId?: string;
}

