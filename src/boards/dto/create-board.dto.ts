import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsUUID()
  workspaceId: string;
}
