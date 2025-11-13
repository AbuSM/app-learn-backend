import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { CardPriority, CardStatus } from '../../../common/enums';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsEnum(CardPriority)
  priority?: CardPriority;

  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  spentHours?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}
