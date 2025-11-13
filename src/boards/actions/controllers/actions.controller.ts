import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ActionsService } from '../services/actions.service';

@Controller('tasks/actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get('board/:boardId')
  findByBoard(
    @Param('boardId') boardId: string,
    @Query('limit') limit: string = '50',
  ) {
    return this.actionsService.findByBoard(boardId, parseInt(limit, 10));
  }

  @Get('board/:boardId/user/:userId')
  findByBoardAndUser(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Query('limit') limit: string = '50',
  ) {
    return this.actionsService.findByBoardAndUser(boardId, userId, parseInt(limit, 10));
  }

  @Get('target/:targetId')
  findByTarget(@Param('targetId') targetId: string) {
    return this.actionsService.findByTarget(targetId);
  }
}
