import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CardsService } from '../services/cards.service';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';

@Controller('tasks/cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  create(@Body() createCardDto: CreateCardDto, @GetUser() user) {
    return this.cardsService.create(createCardDto, user.id);
  }

  @Get('list/:listId')
  findByList(@Param('listId') listId: string) {
    return this.cardsService.findByList(listId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCardDto: UpdateCardDto) {
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardsService.remove(id);
  }

  @Post(':id/assignees')
  assignUser(@Param('id') cardId: string, @Body('userId') userId: string) {
    return this.cardsService.assignUser(cardId, userId);
  }

  @Delete(':id/assignees/:userId')
  unassignUser(@Param('id') cardId: string, @Param('userId') userId: string) {
    return this.cardsService.unassignUser(cardId, userId);
  }

  @Post(':id/watchers')
  addWatcher(@Param('id') cardId: string, @Body('userId') userId: string) {
    return this.cardsService.addWatcher(cardId, userId);
  }

  @Delete(':id/watchers/:userId')
  removeWatcher(@Param('id') cardId: string, @Param('userId') userId: string) {
    return this.cardsService.removeWatcher(cardId, userId);
  }

  @Patch(':id/move')
  moveCard(
    @Param('id') cardId: string,
    @Body('listId') newListId: string,
    @Body('position') newPosition: number,
  ) {
    return this.cardsService.moveCard(cardId, newListId, newPosition);
  }

  @Post(':listId/reorder')
  reorderCards(@Param('listId') listId: string, @Body('cardIds') cardIds: string[]) {
    return this.cardsService.reorderCards(listId, cardIds);
  }
}
