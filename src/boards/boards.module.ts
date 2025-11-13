import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { List } from './lists/entities/list.entity';
import { Card } from './cards/entities/card.entity';
import { CardComment } from './comments/entities/card-comment.entity';
import { Action } from './actions/entities/action.entity';
import { BoardsService } from './services/boards.service';
import { ListsService } from './lists/services/lists.service';
import { CardsService } from './cards/services/cards.service';
import { CommentsService } from './comments/services/comments.service';
import { ActionsService } from './actions/services/actions.service';
import { BoardsController } from './controllers/boards.controller';
import { ListsController } from './lists/controllers/lists.controller';
import { CardsController } from './cards/controllers/cards.controller';
import { CommentsController } from './comments/controllers/comments.controller';
import { ActionsController } from './actions/controllers/actions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardMember, List, Card, CardComment, Action]),
  ],
  controllers: [BoardsController, ListsController, CardsController, CommentsController, ActionsController],
  providers: [BoardsService, ListsService, CardsService, CommentsService, ActionsService],
  exports: [BoardsService, ListsService, CardsService, CommentsService, ActionsService],
})
export class BoardsModule {}
