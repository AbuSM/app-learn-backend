import { IsString, IsOptional, IsNumber, IsUUID, IsDateString, IsEnum, IsArray } from 'class-validator';
import { CardPriority, CardStatus } from '../../../common/enums';

export class CreateCardDto {
  @IsString()
  title: string;

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

  @IsNumber()
  position: number;

  @IsUUID()
  listId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;
}
