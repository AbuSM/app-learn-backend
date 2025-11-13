import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}
