import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EndWorkDto {
  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
