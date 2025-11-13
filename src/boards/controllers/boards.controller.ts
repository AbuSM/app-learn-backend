import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { BoardsService } from '../services/boards.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { MemberRole } from '../../common/enums';

@Controller('tasks/boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() createBoardDto: CreateBoardDto, @GetUser() user) {
    return this.boardsService.create(createBoardDto, user.id);
  }

  @Get('workspace/:workspaceId')
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.boardsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @GetUser() user) {
    return this.boardsService.update(id, updateBoardDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user) {
    return this.boardsService.remove(id, user.id);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.boardsService.getBoardMembers(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') boardId: string,
    @Body('userId') userIdToAdd: string,
    @Body('role') role: MemberRole = MemberRole.MEMBER,
    @GetUser() user,
  ) {
    if (!userIdToAdd) {
      throw new BadRequestException('userId is required');
    }
    return this.boardsService.addMember(boardId, userIdToAdd, user.id, role);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') boardId: string, @Param('userId') userIdToRemove: string, @GetUser() user) {
    return this.boardsService.removeMember(boardId, userIdToRemove, user.id);
  }

  @Patch(':id/members/:userId/role')
  updateMemberRole(
    @Param('id') boardId: string,
    @Param('userId') userIdToUpdate: string,
    @Body('role') newRole: MemberRole,
    @GetUser() user,
  ) {
    if (!newRole) {
      throw new BadRequestException('role is required');
    }
    return this.boardsService.updateMemberRole(boardId, userIdToUpdate, newRole, user.id);
  }
}
