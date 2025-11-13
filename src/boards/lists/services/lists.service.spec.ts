import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListsService } from './lists.service';
import { List } from '../entities/list.entity';
import { NotFoundException } from '@nestjs/common';

describe('ListsService', () => {
  let service: ListsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: getRepositoryToken(List),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new list', async () => {
      const createListDto = {
        title: 'To Do',
        boardId: 'board-1',
        position: 1,
      };

      const mockList = {
        id: 'list-1',
        ...createListDto,
        isActive: true,
        cards: [],
      };

      mockRepository.create.mockReturnValue(mockList);
      mockRepository.save.mockResolvedValue(mockList);

      const result = await service.create(createListDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createListDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('list-1');
      expect(result.title).toBe('To Do');
    });
  });

  describe('findByBoard', () => {
    it('should return all active lists in a board ordered by position', async () => {
      const mockLists = [
        { id: 'list-1', name: 'To Do', position: 1, boardId: 'board-1', isActive: true },
        { id: 'list-2', name: 'In Progress', position: 2, boardId: 'board-1', isActive: true },
        { id: 'list-3', name: 'Done', position: 3, boardId: 'board-1', isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockLists);

      const result = await service.findByBoard('board-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { boardId: 'board-1', isActive: true },
        relations: ['cards'],
        order: { position: 'ASC' },
      });
      expect(result).toEqual(mockLists);
      expect(result.length).toBe(3);
    });

    it('should return empty array if no lists exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByBoard('board-1');

      expect(result).toEqual([]);
    });

    it('should not return inactive lists', async () => {
      const mockLists = [
        { id: 'list-1', name: 'To Do', position: 1, boardId: 'board-1', isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockLists);

      await service.findByBoard('board-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { boardId: 'board-1', isActive: true },
        relations: ['cards'],
        order: { position: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a list by id', async () => {
      const mockList = {
        id: 'list-1',
        name: 'To Do',
        boardId: 'board-1',
        isActive: true,
        cards: [],
      };

      mockRepository.findOne.mockResolvedValue(mockList);

      const result = await service.findOne('list-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'list-1', isActive: true },
        relations: ['cards'],
      });
      expect(result).toEqual(mockList);
    });

    it('should throw NotFoundException if list does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if list is inactive', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('list-1')).rejects.toThrow(
        'List with ID list-1 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a list', async () => {
      const mockList = {
        id: 'list-1',
        title: 'To Do',
        boardId: 'board-1',
        isActive: true,
      };

      const updateListDto = {
        title: 'Updated To Do',
      };

      const updatedList = { ...mockList, ...updateListDto };

      mockRepository.findOne.mockResolvedValue(mockList);
      mockRepository.save.mockResolvedValue(updatedList);

      const result = await service.update('list-1', updateListDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'list-1', isActive: true },
        relations: ['cards'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated To Do');
    });

    it('should throw NotFoundException if list does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a list', async () => {
      const mockList = {
        id: 'list-1',
        name: 'To Do',
        isActive: true,
      };

      const deletedList = { ...mockList, isActive: false };

      mockRepository.findOne.mockResolvedValue(mockList);
      mockRepository.save.mockResolvedValue(deletedList);

      await service.remove('list-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
    });

    it('should throw NotFoundException if list does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
