import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          isActive: true,
        },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-123')).rejects.toThrow(
        'User with ID user-123 not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      const updateUserDto = {
        firstName: 'Johnny',
        lastName: 'Smith',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result.firstName).toBe('Johnny');
      expect(result.lastName).toBe('Smith');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { firstName: 'Johnny' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      const updateUserDto = {
        firstName: 'Johnny',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: 'Johnny',
      });

      const result = await service.update('user-1', updateUserDto);

      expect(result.firstName).toBe('Johnny');
      expect(result.lastName).toBe('Doe'); // Unchanged
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('user-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('user-123')).rejects.toThrow(
        'User with ID user-123 not found',
      );
    });
  });
});
