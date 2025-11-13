import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CalendarService } from '../services/calendar.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto, @GetUser() user) {
    return this.calendarService.create(createEventDto, user.id);
  }

  @Get('workspace/:workspaceId')
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.calendarService.findByWorkspace(workspaceId);
  }

  @Get('workspace/:workspaceId/upcoming')
  getUpcoming(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.calendarService.getUpcomingEvents(workspaceId, limitNum);
  }

  @Get('workspace/:workspaceId/ongoing')
  getOngoing(@Param('workspaceId') workspaceId: string) {
    return this.calendarService.getOngoingEvents(workspaceId);
  }

  @Get('workspace/:workspaceId/month')
  findByMonth(
    @Param('workspaceId') workspaceId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const currentDate = new Date();
    const yearNum = year ? parseInt(year, 10) : currentDate.getFullYear();
    const monthNum = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    return this.calendarService.findByWorkspaceAndMonth(workspaceId, yearNum, monthNum);
  }

  @Get('workspace/:workspaceId/range')
  findByDateRange(
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format');
    }

    return this.calendarService.findByWorkspaceAndDate(workspaceId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.calendarService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.calendarService.cancel(id);
  }
}
