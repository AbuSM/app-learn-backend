import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateListDto {
  @IsString()
  title: string;

  @IsNumber()
  position: number;

  @IsUUID()
  boardId: string;
}
