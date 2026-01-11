import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkScheduleDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tasks: string[];
}

