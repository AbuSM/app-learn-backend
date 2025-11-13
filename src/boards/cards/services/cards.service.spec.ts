import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CardsService } from './cards.service';
import { Card } from '../entities/card.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CardsService', () => {
  let service: CardsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: getRepositoryToken(Card),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const createCardDto = {
        title: 'Task 1',
        description: 'Task description',
        listId: 'list-1',
        position: 1,
      };

      const mockCard = {
        id: 'card-1',
        ...createCardDto,
        isActive: true,
        comments: [],
      };

      mockRepository.create.mockReturnValue(mockCard);
      mockRepository.save.mockResolvedValue(mockCard);

      const result = await service.create(createCardDto, 'user-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createCardDto,
          createdById: 'user-1',
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('card-1');
      expect(result.title).toBe('Task 1');
    });

    it('should throw BadRequestException if title is missing', async () => {
      const createCardDto = {
        description: 'Task description',
        listId: 'list-1',
      };

      jest.spyOn(mockRepository, 'create').mockImplementation(() => {
        throw new BadRequestException('Card title is required');
      });

      await expect(service.create(createCardDto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByList', () => {
    it('should return all active cards in a list ordered by position', async () => {
      const mockCards = [
        { id: 'card-1', title: 'Task 1', position: 1, listId: 'list-1', isActive: true },
        { id: 'card-2', title: 'Task 2', position: 2, listId: 'list-1', isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockCards);

      const result = await service.findByList('list-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        relations: ['createdBy', 'assignees', 'watchers', 'comments'],
        order: { position: 'ASC' },
      });
      expect(result).toEqual(mockCards);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no cards exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByList('list-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a card by id', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'Task 1',
        description: 'Task description',
        listId: 'list-1',
        isActive: true,
        comments: [],
      };

      mockRepository.findOne.mockResolvedValue(mockCard);

      const result = await service.findOne('card-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        relations: ['createdBy', 'assignees', 'watchers', 'comments', 'comments.author', 'list'],
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('card-123')).rejects.toThrow(
        'Card with ID card-123 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'Task 1',
        description: 'Old description',
        listId: 'list-1',
        isActive: true,
      };

      const updateCardDto = {
        description: 'New description',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };

      mockRepository.findOne.mockResolvedValue(mockCard);
      mockRepository.save.mockResolvedValue(updatedCard);

      const result = await service.update('card-1', updateCardDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        relations: ['createdBy', 'assignees', 'watchers', 'comments', 'comments.author', 'list'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.description).toBe('New description');
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'Task 1',
      };

      mockRepository.findOne.mockResolvedValue(mockCard);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('card-1');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockCard);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('moveCard', () => {
    it('should move a card to a different list', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'Task 1',
        listId: 'list-1',
        position: 1,
      };

      const movedCard = { ...mockCard, listId: 'list-2', position: 3 };

      mockRepository.findOne.mockResolvedValue(mockCard);
      mockRepository.save.mockResolvedValue(movedCard);

      const result = await service.moveCard('card-1', 'list-2', 3);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.listId).toBe('list-2');
      expect(result.position).toBe(3);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.moveCard('nonexistent', 'list-2', 3)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
