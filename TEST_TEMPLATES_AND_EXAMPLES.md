# Test Templates and Examples

Complete testing templates and examples for all API endpoints and services.

---

## Table of Contents
1. [Service Tests](#service-tests)
2. [Controller Tests](#controller-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Test Examples](#e2e-test-examples)

---

## Service Tests

### 1. Calendar Service Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarService } from './services/calendar.service';
import { CalendarEvent } from './entities/calendar-event.entity';
import { EventStatus } from '../common/enums';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CalendarService', () => {
  let service: CalendarService;
  let mockRepository;

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

  describe('create', () => {
    it('should create calendar event with valid future dates', async () => {
      const createEventDto = {
        title: 'Team Meeting',
        startDate: '2024-12-20T10:00:00Z',
        endDate: '2024-12-20T11:00:00Z',
        workspaceId: 'workspace-1',
      };

      // Mock implementation
      mockRepository.create.mockReturnValue({ ...createEventDto, id: 'event-1' });
      mockRepository.save.mockResolvedValue({ ...createEventDto, id: 'event-1' });

      const result = await service.create(createEventDto, 'user-1');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.id).toBe('event-1');
    });

    it('should reject event with past start date', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const createEventDto = {
        title: 'Past Event',
        startDate: pastDate.toISOString(),
        endDate: new Date().toISOString(),
        workspaceId: 'workspace-1',
      };

      await expect(service.create(createEventDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return event if exists', async () => {
      const event = { id: 'event-1', title: 'Meeting' };
      mockRepository.findOne.mockResolvedValue(event);

      const result = await service.findOne('event-1');

      expect(result.id).toBe('event-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

---

### 2. Boards Service Template

```typescript
describe('BoardsService', () => {
  let service: BoardsService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Board),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
  });

  describe('create', () => {
    it('should create board with valid data', async () => {
      const createBoardDto = {
        name: 'Project Alpha',
        workspaceId: 'workspace-1',
      };

      mockRepository.create.mockReturnValue({
        ...createBoardDto,
        id: 'board-1',
      });
      mockRepository.save.mockResolvedValue({
        ...createBoardDto,
        id: 'board-1',
      });

      const result = await service.create(createBoardDto, 'user-1');

      expect(result.id).toBe('board-1');
      expect(result.name).toBe('Project Alpha');
    });
  });

  describe('authorization', () => {
    it('should allow admin to update board', async () => {
      const board = {
        id: 'board-1',
        members: [{ userId: 'user-1', role: MemberRole.ADMIN }],
      };

      mockRepository.findOne.mockResolvedValue(board);
      mockRepository.save.mockResolvedValue({
        ...board,
        name: 'Updated',
      });

      const result = await service.update('board-1', { name: 'Updated' }, 'user-1');

      expect(result.name).toBe('Updated');
    });

    it('should reject non-admin update', async () => {
      const board = {
        id: 'board-1',
        members: [{ userId: 'user-1', role: MemberRole.MEMBER }],
      };

      mockRepository.findOne.mockResolvedValue(board);

      await expect(
        service.update('board-1', { name: 'Updated' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
```

---

### 3. Cards Service Template

```typescript
describe('CardsService', () => {
  let service: CardsService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
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

  describe('assignment', () => {
    it('should assign user to card', async () => {
      const card = { id: 'card-1', assignees: ['user-1'] };
      mockRepository.findOne.mockResolvedValue(card);
      mockRepository.save.mockResolvedValue({
        ...card,
        assignees: ['user-1', 'user-2'],
      });

      const result = await service.assignCard('card-1', 'user-2');

      expect(result.assignees).toContain('user-2');
    });

    it('should prevent duplicate assignments', async () => {
      const card = { id: 'card-1', assignees: ['user-1'] };
      mockRepository.findOne.mockResolvedValue(card);
      mockRepository.save.mockResolvedValue(card);

      await service.assignCard('card-1', 'user-1');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
```

---

## Controller Tests

### Calendar Controller Template

```typescript
describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByWorkspace: jest.fn(),
      getUpcomingEvents: jest.fn(),
      getOngoingEvents: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  describe('POST / - Create Event', () => {
    it('should create event', async () => {
      const dto = {
        title: 'Meeting',
        startDate: '2024-12-20T10:00:00Z',
        endDate: '2024-12-20T11:00:00Z',
        workspaceId: 'ws-1',
      };

      jest.spyOn(service, 'create').mockResolvedValue({ ...dto, id: 'evt-1' } as any);

      const result = await controller.create(dto, { id: 'user-1' });

      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result.id).toBe('evt-1');
    });
  });

  describe('GET /workspace/:id', () => {
    it('should return workspace events', async () => {
      const events = [{ id: 'evt-1', title: 'Meeting' }];
      jest.spyOn(service, 'findByWorkspace').mockResolvedValue(events as any);

      const result = await controller.findByWorkspace('ws-1');

      expect(service.findByWorkspace).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual(events);
    });
  });

  describe('GET /workspace/:id/upcoming', () => {
    it('should return upcoming events with default limit', async () => {
      const events = [{ id: 'evt-1', status: 'upcoming' }];
      jest.spyOn(service, 'getUpcomingEvents').mockResolvedValue(events as any);

      const result = await controller.getUpcoming('ws-1');

      expect(service.getUpcomingEvents).toHaveBeenCalledWith('ws-1', 10);
      expect(result).toEqual(events);
    });

    it('should support custom limit', async () => {
      const events = [{ id: 'evt-1' }];
      jest.spyOn(service, 'getUpcomingEvents').mockResolvedValue(events as any);

      await controller.getUpcoming('ws-1', '20');

      expect(service.getUpcomingEvents).toHaveBeenCalledWith('ws-1', 20);
    });
  });

  describe('GET /:id - Get Event', () => {
    it('should return event by ID', async () => {
      const event = { id: 'evt-1', title: 'Meeting' };
      jest.spyOn(service, 'findOne').mockResolvedValue(event as any);

      const result = await controller.findOne('evt-1');

      expect(service.findOne).toHaveBeenCalledWith('evt-1');
      expect(result.id).toBe('evt-1');
    });
  });

  describe('PATCH /:id - Update Event', () => {
    it('should update event', async () => {
      const updated = { id: 'evt-1', title: 'Updated' };
      const dto = { title: 'Updated' };

      jest.spyOn(service, 'update').mockResolvedValue(updated as any);

      const result = await controller.update('evt-1', dto);

      expect(service.update).toHaveBeenCalledWith('evt-1', dto);
      expect(result.title).toBe('Updated');
    });
  });

  describe('DELETE /:id - Delete Event', () => {
    it('should delete event', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('evt-1');

      expect(service.remove).toHaveBeenCalledWith('evt-1');
    });
  });

  describe('PATCH /:id/cancel - Cancel Event', () => {
    it('should cancel event', async () => {
      const cancelled = { id: 'evt-1', status: 'cancelled' };
      jest.spyOn(service, 'cancel').mockResolvedValue(cancelled as any);

      const result = await controller.cancel('evt-1');

      expect(service.cancel).toHaveBeenCalledWith('evt-1');
      expect(result.status).toBe('cancelled');
    });
  });
});
```

---

## Integration Tests

### Database Integration Test Example

```typescript
describe('CalendarService Integration', () => {
  let service: CalendarService;
  let repository: Repository<CalendarEvent>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [CalendarEvent],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CalendarEvent]),
      ],
      providers: [CalendarService],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    repository = module.get<Repository<CalendarEvent>>(
      getRepositoryToken(CalendarEvent),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create and retrieve event', async () => {
    const createDto = {
      title: 'Test Event',
      startDate: '2024-12-20T10:00:00Z',
      endDate: '2024-12-20T11:00:00Z',
      workspaceId: 'ws-1',
    };

    const created = await service.create(createDto, 'user-1');
    const found = await service.findOne(created.id);

    expect(found.title).toBe('Test Event');
  });

  it('should validate dates', async () => {
    const pastDto = {
      title: 'Past Event',
      startDate: '2020-01-01T10:00:00Z',
      endDate: '2024-12-20T11:00:00Z',
      workspaceId: 'ws-1',
    };

    await expect(service.create(pastDto, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
```

---

## E2E Test Examples

### Supertest Example for Calendar Endpoints

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('Calendar API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    jwtToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/calendar - Create Event', () => {
    it('should create event with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Team Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Team Meeting');
    });

    it('should reject past dates', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Past Event',
          startDate: '2020-01-01T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('past');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar')
        .send({
          title: 'Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/calendar/workspace/:id', () => {
    it('should return workspace events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/workspace/workspace-1')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/calendar/workspace/:id/upcoming', () => {
    it('should return upcoming events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/workspace/workspace-1/upcoming')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/workspace/workspace-1/upcoming?limit=5')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/calendar/:id', () => {
    it('should return event details', async () => {
      // Create event first
      const createRes = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      // Get event
      const getRes = await request(app.getHttpServer())
        .get(`/api/calendar/${createRes.body.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(createRes.body.id);
    });
  });

  describe('PATCH /api/calendar/:id', () => {
    it('should update event', async () => {
      // Create event
      const createRes = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      // Update event
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/calendar/${createRes.body.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Updated Meeting',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Meeting');
    });
  });

  describe('PATCH /api/calendar/:id/cancel', () => {
    it('should cancel event', async () => {
      // Create event
      const createRes = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      // Cancel event
      const cancelRes = await request(app.getHttpServer())
        .patch(`/api/calendar/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe('cancelled');
    });
  });

  describe('DELETE /api/calendar/:id', () => {
    it('should delete event', async () => {
      // Create event
      const createRes = await request(app.getHttpServer())
        .post('/api/calendar')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Meeting',
          startDate: '2024-12-20T10:00:00Z',
          endDate: '2024-12-20T11:00:00Z',
          workspaceId: 'workspace-1',
        });

      // Delete event
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/calendar/${createRes.body.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deleted
      const getRes = await request(app.getHttpServer())
        .get(`/api/calendar/${createRes.body.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
```

---

## Running Tests

### Installation
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Jest Configuration
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### Run Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- calendar.service.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e
```

---

## Test Coverage Goals

| Module | Target |
|--------|--------|
| Calendar Service | 90%+ |
| Calendar Controller | 85%+ |
| Boards Service | 85%+ |
| Boards Controller | 80%+ |
| Cards Service | 85%+ |
| Comments Service | 80%+ |
| Actions Service | 80%+ |
| **Overall** | **85%+** |

---

**Last Updated**: November 13, 2024

