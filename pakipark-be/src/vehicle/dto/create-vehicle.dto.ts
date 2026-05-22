import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  brand!: string;

  @IsNotEmpty()
  @IsString()
  model!: string;

  @IsNotEmpty()
  @IsString()
  color!: string;

  @IsNotEmpty()
  @IsString()
  plateNumber!: string;

  @IsOptional()
  @IsString()
  type?: string;
}
