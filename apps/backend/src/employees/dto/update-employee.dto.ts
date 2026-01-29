import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { DisabilityLevel, ContractStatus } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  workingHours?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  contractPeriod?: string;

  @IsEnum(DisabilityLevel)
  @IsOptional()
  disabilityLevel?: DisabilityLevel;

  @IsString()
  @IsOptional()
  disabilityType?: string;

  @IsString()
  @IsOptional()
  disabilityRecognitionDate?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  severeCertificateUrl?: string;

  @IsString()
  @IsOptional()
  additionalTerms?: string;

  @IsBoolean()
  @IsOptional()
  sensitiveInfoConsent?: boolean;

  @IsEnum(ContractStatus)
  @IsOptional()
  contractStatus?: ContractStatus;

  @IsString()
  @IsOptional()
  ci?: string;

  @IsString()
  @IsOptional()
  kakaoId?: string;
}
