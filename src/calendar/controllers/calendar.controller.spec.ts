import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from '../services/calendar.service';
import { EventStatus } from '../../common/enums';
import { BadRequestException } from '@nestjs/common';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockUser = { id: 'user-1', email: 'user@example.com' };

  beforeEach(async () => {
    const mockCalendarService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByWorkspace: jest.fn(),
      getUpcomingEvents: jest.fn(),
      getOngoingEvents: jest.fn(),
      findByWorkspaceAndMonth: jest.fn(),
      findByWorkspaceAndDate: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto: any = {
        title: 'Team Meeting',
        description: 'Quarterly planning',
        startDate: '2024-12-20T10:00:00Z',
        endDate: '2024-12-20T11:00:00Z',
        location: 'Conference Room A',
        color: '#3C50E0',
        workspaceId: 'workspace-1',
      };

      const mockResult = { ...createEventDto, id: 'event-1' };
      jest.spyOn(service, 'create').mockResolvedValue(mockResult as any);

      const result = await controller.create(createEventDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createEventDto, mockUser.id);
      expect(result.id).toBe('event-1');
    });
  });

  describe('findByWorkspace', () => {
    it('should return all events in workspace', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Meeting 1' },
        { id: 'event-2', title: 'Meeting 2' },
      ];

      jest.spyOn(service, 'findByWorkspace').mockResolvedValue(mockEvents as any);

      const result = await controller.findByWorkspace('workspace-1');

      expect(service.findByWorkspace).toHaveBeenCalledWith('workspace-1');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming events with default limit', async () => {
      const mockEvents = [
        { id: 'event-1', status: EventStatus.UPCOMING },
      ];

      jest.spyOn(service, 'getUpcomingEvents').mockResolvedValue(mockEvents as any);

      const result = await controller.getUpcoming('workspace-1');

      expect(service.getUpcomingEvents).toHaveBeenCalledWith('workspace-1', 10);
      expect(result).toEqual(mockEvents);
    });

    it('should return upcoming events with custom limit', async () => {
      const mockEvents = [
        { id: 'event-1', status: EventStatus.UPCOMING },
      ];

      jest.spyOn(service, 'getUpcomingEvents').mockResolvedValue(mockEvents as any);

      const result = await controller.getUpcoming('workspace-1', '20');

      expect(service.getUpcomingEvents).toHaveBeenCalledWith('workspace-1', 20);
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getOngoing', () => {
    it('should return ongoing events', async () => {
      const mockEvents = [
        { id: 'event-1', status: EventStatus.ONGOING },
      ];

      jest.spyOn(service, 'getOngoingEvents').mockResolvedValue(mockEvents as any);

      const result = await controller.getOngoing('workspace-1');

      expect(service.getOngoingEvents).toHaveBeenCalledWith('workspace-1');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findByMonth', () => {
    it('should return events for current month by default', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'December Event' },
      ];

      jest.spyOn(service, 'findByWorkspaceAndMonth').mockResolvedValue(mockEvents as any);

      const result = await controller.findByMonth('workspace-1');

      expect(service.findByWorkspaceAndMonth).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });

    it('should return events for specific month and year', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Event' },
      ];

      jest.spyOn(service, 'findByWorkspaceAndMonth').mockResolvedValue(mockEvents as any);

      const result = await controller.findByMonth('workspace-1', '2024', '12');

      expect(service.findByWorkspaceAndMonth).toHaveBeenCalledWith(
        'workspace-1',
        2024,
        12,
      );
      expect(result).toEqual(mockEvents);
    });

    it('should throw BadRequestException for invalid month', () => {
      expect(() => {
        controller.findByMonth('workspace-1', '2024', '13');
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for month 0', () => {
      expect(() => {
        controller.findByMonth('workspace-1', '2024', '0');
      }).toThrow(BadRequestException);
    });
  });

  describe('findByDateRange', () => {
    it('should return events within date range', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Holiday Week' },
      ];

      jest.spyOn(service, 'findByWorkspaceAndDate').mockResolvedValue(mockEvents as any);

      const result = await controller.findByDateRange(
        'workspace-1',
        '2024-12-15T00:00:00Z',
        '2024-12-31T23:59:59Z',
      );

      expect(service.findByWorkspaceAndDate).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });

    it('should throw BadRequestException if startDate is missing', () => {
      expect(() => {
        controller.findByDateRange('workspace-1', '', '2024-12-31T23:59:59Z');
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if endDate is missing', () => {
      expect(() => {
        controller.findByDateRange('workspace-1', '2024-12-15T00:00:00Z', '');
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid date format', () => {
      expect(() => {
        controller.findByDateRange('workspace-1', 'invalid', '2024-12-31');
      }).toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return event by id', async () => {
      const mockEvent = { id: 'event-1', title: 'Team Meeting' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);

      const result = await controller.findOne('event-1');

      expect(service.findOne).toHaveBeenCalledWith('event-1');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto: any = { title: 'Updated Meeting' };
      const mockResult = { id: 'event-1', title: 'Updated Meeting' };

      jest.spyOn(service, 'update').mockResolvedValue(mockResult as any);

      const result = await controller.update('event-1', updateEventDto);

      expect(service.update).toHaveBeenCalledWith('event-1', updateEventDto);
      expect(result.title).toBe('Updated Meeting');
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('event-1');

      expect(service.remove).toHaveBeenCalledWith('event-1');
    });
  });

  describe('cancel', () => {
    it('should cancel an event', async () => {
      const mockResult = {
        id: 'event-1',
        title: 'Meeting',
        status: EventStatus.CANCELLED,
      };

      jest.spyOn(service, 'cancel').mockResolvedValue(mockResult as any);

      const result = await controller.cancel('event-1');

      expect(service.cancel).toHaveBeenCalledWith('event-1');
      expect(result.status).toBe(EventStatus.CANCELLED);
    });
  });
});
