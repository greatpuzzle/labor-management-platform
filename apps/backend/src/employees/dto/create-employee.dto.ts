import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { DisabilityLevel } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  dob: string;

  @IsEnum(DisabilityLevel)
  disabilityLevel: DisabilityLevel;

  @IsString()
  @IsNotEmpty()
  disabilityType: string;

  @IsString()
  @IsNotEmpty()
  disabilityRecognitionDate: string;

  @IsString()
  @IsNotEmpty()
  emergencyContactName: string;

  @IsString()
  @IsNotEmpty()
  emergencyContactPhone: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsBoolean()
  @IsOptional()
  sensitiveInfoConsent?: boolean;

  // 근로 조건은 나중에 어드민이 입력 (기본값 사용)
  @IsString()
  @IsOptional()
  workingHours?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  contractPeriod?: string;
}
