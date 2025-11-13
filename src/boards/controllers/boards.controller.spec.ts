import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from '../services/boards.service';
import { MemberRole } from '../../common/enums';
import { BadRequestException } from '@nestjs/common';

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: BoardsService;

  const mockUser = { id: 'user-1', email: 'user@example.com' };

  const mockBoardsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByWorkspace: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getBoardMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [
        {
          provide: BoardsService,
          useValue: mockBoardsService,
        },
      ],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
    service = module.get<BoardsService>(BoardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new board', async () => {
      const createBoardDto = {
        name: 'Project Board',
        description: 'Board description',
        color: '#3C50E0',
        workspaceId: 'workspace-1',
      };

      const mockBoard = { id: 'board-1', ...createBoardDto };
      mockBoardsService.create.mockResolvedValue(mockBoard);

      const result = await controller.create(createBoardDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createBoardDto, mockUser.id);
      expect(result.id).toBe('board-1');
    });
  });

  describe('findByWorkspace', () => {
    it('should return all boards in a workspace', async () => {
      const mockBoards = [
        { id: 'board-1', name: 'Board 1' },
        { id: 'board-2', name: 'Board 2' },
      ];

      mockBoardsService.findByWorkspace.mockResolvedValue(mockBoards);

      const result = await controller.findByWorkspace('workspace-1');

      expect(service.findByWorkspace).toHaveBeenCalledWith('workspace-1');
      expect(result.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a single board by id', async () => {
      const mockBoard = {
        id: 'board-1',
        name: 'Project Board',
        description: 'Board description',
      };

      mockBoardsService.findOne.mockResolvedValue(mockBoard);

      const result = await controller.findOne('board-1');

      expect(service.findOne).toHaveBeenCalledWith('board-1');
      expect(result.id).toBe('board-1');
    });
  });

  describe('update', () => {
    it('should update a board', async () => {
      const updateBoardDto = {
        name: 'Updated Board',
      };

      const mockBoard = { id: 'board-1', name: 'Updated Board' };
      mockBoardsService.update.mockResolvedValue(mockBoard);

      const result = await controller.update('board-1', updateBoardDto, mockUser);

      expect(service.update).toHaveBeenCalledWith('board-1', updateBoardDto, mockUser.id);
      expect(result.name).toBe('Updated Board');
    });
  });

  describe('remove', () => {
    it('should delete a board', async () => {
      mockBoardsService.remove.mockResolvedValue(undefined);

      await controller.remove('board-1', mockUser);

      expect(service.remove).toHaveBeenCalledWith('board-1', mockUser.id);
    });
  });

  describe('getMembers', () => {
    it('should return all board members', async () => {
      const mockMembers = [
        { userId: 'user-1', role: MemberRole.ADMIN },
        { userId: 'user-2', role: MemberRole.MEMBER },
      ];

      mockBoardsService.getBoardMembers.mockResolvedValue(mockMembers);

      const result = await controller.getMembers('board-1');

      expect(service.getBoardMembers).toHaveBeenCalledWith('board-1');
      expect(result.length).toBe(2);
    });
  });

  describe('addMember', () => {
    it('should add a member to board', async () => {
      const mockMember = {
        boardId: 'board-1',
        userId: 'user-2',
        role: MemberRole.MEMBER,
      };

      mockBoardsService.addMember.mockResolvedValue(mockMember);

      const result = await controller.addMember(
        'board-1',
        'user-2',
        MemberRole.MEMBER,
        mockUser,
      );

      expect(service.addMember).toHaveBeenCalledWith(
        'board-1',
        'user-2',
        mockUser.id,
        MemberRole.MEMBER,
      );
      expect(result.userId).toBe('user-2');
    });

    it('should throw BadRequestException if userId is missing', () => {
      expect(() => {
        controller.addMember('board-1', '', MemberRole.MEMBER, mockUser);
      }).toThrow(BadRequestException);
    });

    it('should add member with default MEMBER role', async () => {
      const mockMember = {
        boardId: 'board-1',
        userId: 'user-2',
        role: MemberRole.MEMBER,
      };

      mockBoardsService.addMember.mockResolvedValue(mockMember);

      const result = await controller.addMember('board-1', 'user-2', undefined, mockUser);

      expect(service.addMember).toHaveBeenCalledWith(
        'board-1',
        'user-2',
        mockUser.id,
        MemberRole.MEMBER,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member from board', async () => {
      mockBoardsService.removeMember.mockResolvedValue(undefined);

      await controller.removeMember('board-1', 'user-2', mockUser);

      expect(service.removeMember).toHaveBeenCalledWith('board-1', 'user-2', mockUser.id);
    });
  });

  describe('updateMemberRole', () => {
    it('should update a member role', async () => {
      const mockMember = {
        boardId: 'board-1',
        userId: 'user-2',
        role: MemberRole.ADMIN,
      };

      mockBoardsService.updateMemberRole.mockResolvedValue(mockMember);

      const result = await controller.updateMemberRole(
        'board-1',
        'user-2',
        MemberRole.ADMIN,
        mockUser,
      );

      expect(service.updateMemberRole).toHaveBeenCalledWith(
        'board-1',
        'user-2',
        MemberRole.ADMIN,
        mockUser.id,
      );
      expect(result.role).toBe(MemberRole.ADMIN);
    });

    it('should throw BadRequestException if role is missing', () => {
      expect(() => {
        controller.updateMemberRole('board-1', 'user-2', undefined, mockUser);
      }).toThrow(BadRequestException);
    });
  });
});
