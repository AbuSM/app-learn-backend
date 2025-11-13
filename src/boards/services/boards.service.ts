import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../entities/board.entity';
import { BoardMember } from '../entities/board-member.entity';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { MemberRole, ActionType } from '../../common/enums';
import { ActionsService } from '../actions/services/actions.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private boardMembersRepository: Repository<BoardMember>,
    private actionsService: ActionsService,
  ) {}

  async create(createBoardDto: CreateBoardDto, userId: string): Promise<Board> {
    const board = this.boardsRepository.create(createBoardDto);
    const savedBoard = await this.boardsRepository.save(board);

    // Add creator as admin member
    await this.boardMembersRepository.save({
      boardId: savedBoard.id,
      userId,
      role: MemberRole.ADMIN,
    });

    // Log action
    await this.actionsService.logAction(
      savedBoard.id,
      userId,
      ActionType.CREATE_BOARD,
      savedBoard.id,
      'board',
      { name: savedBoard.name },
      `Created board "${savedBoard.name}"`,
    );

    return this.findOne(savedBoard.id);
  }

  async findByWorkspace(workspaceId: string): Promise<Board[]> {
    return this.boardsRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['members', 'members.user', 'lists'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({
      where: { id, isActive: true },
      relations: ['members', 'members.user', 'lists', 'lists.cards'],
    });
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<Board> {
    const board = await this.findOne(id);

    // Check permission
    const member = board.members?.find((m) => m.userId === userId);
    if (!member || member.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only board admins can update the board');
    }

    const originalName = board.name;
    Object.assign(board, updateBoardDto);
    const updatedBoard = await this.boardsRepository.save(board);

    // Log action
    await this.actionsService.logAction(
      id,
      userId,
      ActionType.UPDATE_BOARD,
      id,
      'board',
      { oldName: originalName, newName: updatedBoard.name },
      `Updated board details`,
    );

    return updatedBoard;
  }

  async remove(id: string, userId: string): Promise<void> {
    const board = await this.findOne(id);

    // Check permission
    const member = board.members?.find((m) => m.userId === userId);
    if (!member || member.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only board admins can delete the board');
    }

    board.isActive = false;
    await this.boardsRepository.save(board);

    // Log action
    await this.actionsService.logAction(
      id,
      userId,
      ActionType.DELETE_BOARD,
      id,
      'board',
      { boardName: board.name },
      `Deleted board "${board.name}"`,
    );
  }

  async addMember(boardId: string, userIdToAdd: string, userId: string, role: MemberRole = MemberRole.MEMBER): Promise<BoardMember> {
    const board = await this.findOne(boardId);

    // Check permission
    const member = board.members?.find((m) => m.userId === userId);
    if (!member || member.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only board admins can add members');
    }

    // Check if already a member
    const existingMember = await this.boardMembersRepository.findOne({
      where: { boardId, userId: userIdToAdd },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this board');
    }

    const newMember = this.boardMembersRepository.create({
      boardId,
      userId: userIdToAdd,
      role,
    });
    const savedMember = await this.boardMembersRepository.save(newMember);

    // Log action
    await this.actionsService.logAction(
      boardId,
      userId,
      ActionType.ADD_MEMBER,
      userIdToAdd,
      'user',
      { role },
      `Added member with role ${role}`,
    );

    return savedMember;
  }

  async removeMember(boardId: string, userIdToRemove: string, userId: string): Promise<void> {
    const board = await this.findOne(boardId);

    // Check permission
    const member = board.members?.find((m) => m.userId === userId);
    if (!member || member.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only board admins can remove members');
    }

    // Cannot remove yourself if you're the last admin
    if (userIdToRemove === userId) {
      const adminCount = board.members.filter((m) => m.role === MemberRole.ADMIN).length;
      if (adminCount === 1) {
        throw new BadRequestException('Cannot remove the last admin from the board');
      }
    }

    await this.boardMembersRepository.delete({
      boardId,
      userId: userIdToRemove,
    });

    // Log action
    await this.actionsService.logAction(
      boardId,
      userId,
      ActionType.REMOVE_MEMBER,
      userIdToRemove,
      'user',
      {},
      `Removed member from board`,
    );
  }

  async updateMemberRole(boardId: string, userIdToUpdate: string, newRole: MemberRole, userId: string): Promise<BoardMember> {
    const board = await this.findOne(boardId);

    // Check permission
    const member = board.members?.find((m) => m.userId === userId);
    if (!member || member.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only board admins can update member roles');
    }

    const memberToUpdate = board.members.find((m) => m.userId === userIdToUpdate);
    if (!memberToUpdate) {
      throw new NotFoundException('Member not found on this board');
    }

    memberToUpdate.role = newRole;
    const updatedMember = await this.boardMembersRepository.save(memberToUpdate);

    // Log action
    await this.actionsService.logAction(
      boardId,
      userId,
      ActionType.UPDATE_MEMBER_ROLE,
      userIdToUpdate,
      'user',
      { newRole },
      `Updated member role to ${newRole}`,
    );

    return updatedMember;
  }

  async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    const board = await this.findOne(boardId);
    return board.members;
  }

  async checkBoardAccess(boardId: string, userId: string): Promise<boolean> {
    const member = await this.boardMembersRepository.findOne({
      where: { boardId, userId },
    });
    return !!member;
  }
}
