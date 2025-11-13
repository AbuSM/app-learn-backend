import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventStatus } from '../../common/enums';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarRepository: Repository<CalendarEvent>,
  ) {}

  /**
   * Validate that dates are not in the past
   */
  private validateDates(startDate: Date, endDate: Date): void {
    const now = new Date();

    if (startDate < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (endDate < now) {
      throw new BadRequestException('End date cannot be in the past');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  /**
   * Determine event status based on dates
   */
  private determineEventStatus(startDate: Date, endDate: Date): EventStatus {
    const now = new Date();

    if (now < startDate) {
      return EventStatus.UPCOMING;
    }

    if (now >= startDate && now < endDate) {
      return EventStatus.ONGOING;
    }

    if (now >= endDate) {
      return EventStatus.COMPLETED;
    }

    return EventStatus.UPCOMING;
  }

  async create(createEventDto: CreateEventDto, userId: string): Promise<CalendarEvent> {
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    // Validate dates
    this.validateDates(startDate, endDate);

    const status = this.determineEventStatus(startDate, endDate);

    const event = this.calendarRepository.create({
      ...createEventDto,
      startDate,
      endDate,
      status,
      createdById: userId,
    });

    return this.calendarRepository.save(event);
  }

  async findByWorkspace(workspaceId: string): Promise<CalendarEvent[]> {
    return this.calendarRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['createdBy', 'workspace'],
      order: { startDate: 'ASC' },
    });
  }

  async findByWorkspaceAndDate(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    return this.calendarRepository.find({
      where: {
        workspaceId,
        isActive: true,
        startDate: MoreThanOrEqual(startDate),
        endDate: LessThanOrEqual(endDate),
      },
      relations: ['createdBy', 'workspace'],
      order: { startDate: 'ASC' },
    });
  }

  async findByWorkspaceAndMonth(
    workspaceId: string,
    year: number,
    month: number,
  ): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.calendarRepository.find({
      where: {
        workspaceId,
        isActive: true,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
      },
      relations: ['createdBy', 'workspace'],
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CalendarEvent> {
    const event = await this.calendarRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy', 'workspace'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<CalendarEvent> {
    const event = await this.findOne(id);

    // If dates are being updated, validate them
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate ? new Date(updateEventDto.startDate) : event.startDate;
      const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

      this.validateDates(startDate, endDate);

      event.startDate = startDate;
      event.endDate = endDate;
      event.status = this.determineEventStatus(startDate, endDate);
    }

    // Update other fields
    if (updateEventDto.title) event.title = updateEventDto.title;
    if (updateEventDto.description) event.description = updateEventDto.description;
    if (updateEventDto.location) event.location = updateEventDto.location;
    if (updateEventDto.color) event.color = updateEventDto.color;

    return this.calendarRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    event.isActive = false;
    await this.calendarRepository.save(event);
  }

  async cancel(id: string): Promise<CalendarEvent> {
    const event = await this.findOne(id);
    event.status = EventStatus.CANCELLED;
    return this.calendarRepository.save(event);
  }

  async getUpcomingEvents(workspaceId: string, limit: number = 10): Promise<CalendarEvent[]> {
    const now = new Date();

    return this.calendarRepository.find({
      where: {
        workspaceId,
        isActive: true,
        status: EventStatus.UPCOMING,
        startDate: MoreThanOrEqual(now),
      },
      relations: ['createdBy', 'workspace'],
      order: { startDate: 'ASC' },
      take: limit,
    });
  }

  async getOngoingEvents(workspaceId: string): Promise<CalendarEvent[]> {
    const now = new Date();

    return this.calendarRepository.find({
      where: {
        workspaceId,
        isActive: true,
        status: EventStatus.ONGOING,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['createdBy', 'workspace'],
      order: { startDate: 'ASC' },
    });
  }

  async updateEventStatuses(): Promise<void> {
    const activeEvents = await this.calendarRepository.find({
      where: { isActive: true },
    });

    const now = new Date();

    for (const event of activeEvents) {
      let newStatus = event.status;

      if (event.status !== EventStatus.CANCELLED) {
        newStatus = this.determineEventStatus(event.startDate, event.endDate);
      }

      if (newStatus !== event.status) {
        event.status = newStatus;
        await this.calendarRepository.save(event);
      }
    }
  }
}
