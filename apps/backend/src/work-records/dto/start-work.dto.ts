import { IsDateString, IsOptional, IsString } from 'class-validator';

export class StartWorkDto {
  @IsDateString()
  startTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
