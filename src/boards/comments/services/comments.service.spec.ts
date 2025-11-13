import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CardComment } from '../entities/card-comment.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
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
        CommentsService,
        {
          provide: getRepositoryToken(CardComment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new comment', async () => {
      const createCommentDto = {
        content: 'This is a comment',
        cardId: 'card-1',
      };

      const mockComment = {
        id: 'comment-1',
        ...createCommentDto,
        authorId: 'user-1',
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockComment);
      mockRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(createCommentDto, 'user-1');

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        authorId: 'user-1',
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('comment-1');
      expect(result.content).toBe('This is a comment');
    });

    it('should add user id to comment', async () => {
      const createCommentDto = {
        content: 'New comment',
        cardId: 'card-1',
      };

      const mockComment = {
        id: 'comment-1',
        ...createCommentDto,
        authorId: 'user-1',
      };

      mockRepository.create.mockReturnValue(mockComment);
      mockRepository.save.mockResolvedValue(mockComment);

      await service.create(createCommentDto, 'user-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: 'user-1',
        }),
      );
    });
  });

  describe('findByCard', () => {
    it('should return all comments for a card ordered by creation date', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Comment 1',
          cardId: 'card-1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'comment-2',
          content: 'Comment 2',
          cardId: 'card-1',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockComments);

      const result = await service.findByCard('card-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cardId: 'card-1' },
        relations: ['author'],
        order: { createdAt: 'ASC' },
      });
      expect(result.length).toBe(2);
    });

    it('should return empty array if no comments exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByCard('card-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'This is a comment',
        cardId: 'card-1',
        author: { id: 'user-1', email: 'user@example.com' },
      };

      mockRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne('comment-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        relations: ['author', 'card'],
      });
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Original comment',
        cardId: 'card-1',
        authorId: 'user-1',
      };

      const updateCommentDto = {
        content: 'Updated comment',
      };

      const updatedComment = { ...mockComment, ...updateCommentDto };

      mockRepository.findOne.mockResolvedValue(mockComment);
      mockRepository.save.mockResolvedValue(updatedComment);

      const result = await service.update('comment-1', updateCommentDto, 'user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        relations: ['author', 'card'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.content).toBe('Updated comment');
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { content: 'Updated' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not the author', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Original comment',
        authorId: 'user-1',
      };

      mockRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update('comment-1', { content: 'Updated' }, 'user-2'),
      ).rejects.toThrow('You can only update your own comments');
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Comment to delete',
        authorId: 'user-1',
      };

      mockRepository.findOne.mockResolvedValue(mockComment);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('comment-1', 'user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        relations: ['author', 'card'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user is not the author', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Comment to delete',
        authorId: 'user-1',
      };

      mockRepository.findOne.mockResolvedValue(mockComment);

      await expect(service.remove('comment-1', 'user-2')).rejects.toThrow(
        'You can only delete your own comments',
      );
    });
  });
});
