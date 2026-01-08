import { IsString, IsNotEmpty } from 'class-validator';

export class SendContractDto {
  @IsString()
  @IsNotEmpty()
  workingHours: string;

  @IsString()
  @IsNotEmpty()
  salary: string;

  @IsString()
  @IsNotEmpty()
  contractPeriod: string;
}
