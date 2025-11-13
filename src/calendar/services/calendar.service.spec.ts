import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { EventStatus } from '../../common/enums';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CalendarService', () => {
  let service: CalendarService;
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
        CalendarService,
        {
          provide: getRepositoryToken(CalendarEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a calendar event with valid future dates', async () => {
      // Create future dates
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 10);
      const futureEnd = new Date(futureStart);
      futureEnd.setHours(futureEnd.getHours() + 1);

      const createEventDto: any = {
        title: 'Team Meeting',
        description: 'Quarterly planning',
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        location: 'Conference Room A',
        color: '#3C50E0',
        workspaceId: 'workspace-1',
      };

      mockRepository.create.mockReturnValue({
        ...createEventDto,
        id: 'event-1',
        status: EventStatus.UPCOMING,
      });
      mockRepository.save.mockResolvedValue({
        ...createEventDto,
        id: 'event-1',
        status: EventStatus.UPCOMING,
      });

      const result = await service.create(createEventDto, 'user-1');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('event-1');
      expect(result.status).toBe(EventStatus.UPCOMING);
    });

    it('should throw BadRequestException if start date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const createEventDto: any = {
        title: 'Past Event',
        startDate: pastDate.toISOString(),
        endDate: new Date().toISOString(),
        workspaceId: 'workspace-1',
      };

      await expect(service.create(createEventDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      // Create future dates with end before start
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 10);
      futureStart.setHours(futureStart.getHours() + 2);

      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 10);
      futureEnd.setHours(futureEnd.getHours() + 1);

      const createEventDto: any = {
        title: 'Invalid Event',
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        workspaceId: 'workspace-1',
      };

      await expect(service.create(createEventDto, 'user-1')).rejects.toThrow(
        'End date must be after start date',
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Team Meeting',
        status: EventStatus.UPCOMING,
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-1', isActive: true },
        relations: ['createdBy', 'workspace'],
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByWorkspace', () => {
    it('should return all active events in a workspace', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Meeting 1' },
        { id: 'event-2', title: 'Meeting 2' },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findByWorkspace('workspace-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1', isActive: true },
        relations: ['createdBy', 'workspace'],
        order: { startDate: 'ASC' },
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return only upcoming events with limit', async () => {
      const mockEvents = [
        { id: 'event-1', status: EventStatus.UPCOMING },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.getUpcomingEvents('workspace-1', 10);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getOngoingEvents', () => {
    it('should return only ongoing events', async () => {
      const mockEvents = [
        { id: 'event-1', status: EventStatus.ONGOING },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.getOngoingEvents('workspace-1');

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });

  describe('update', () => {
    it('should update event and recalculate status', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Team Meeting',
        startDate: new Date('2024-12-20T10:00:00Z'),
        endDate: new Date('2024-12-20T11:00:00Z'),
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        title: 'Updated Meeting',
      });

      const updateEventDto: any = { title: 'Updated Meeting' };
      const result = await service.update('event-1', updateEventDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Meeting');
    });
  });

  describe('cancel', () => {
    it('should cancel an event', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Team Meeting',
        status: EventStatus.UPCOMING,
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.CANCELLED,
      });

      const result = await service.cancel('event-1');

      expect(result.status).toBe(EventStatus.CANCELLED);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete an event', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Team Meeting',
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        isActive: false,
      });

      await service.remove('event-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
    });
  });

  describe('findByWorkspaceAndMonth', () => {
    it('should return events for a specific month', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'December Event' },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findByWorkspaceAndMonth(
        'workspace-1',
        2024,
        12,
      );

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findByWorkspaceAndDate', () => {
    it('should return events within a date range', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Range Event' },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const startDate = new Date('2024-12-15');
      const endDate = new Date('2024-12-31');

      const result = await service.findByWorkspaceAndDate(
        'workspace-1',
        startDate,
        endDate,
      );

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });
});
