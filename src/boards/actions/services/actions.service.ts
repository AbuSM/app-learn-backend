import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action } from '../entities/action.entity';
import { ActionType } from '../../../common/enums';

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(Action)
    private actionsRepository: Repository<Action>,
  ) {}

  async logAction(
    boardId: string,
    userId: string,
    type: ActionType,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>,
    description?: string,
  ): Promise<Action> {
    const action = this.actionsRepository.create({
      boardId,
      userId,
      type,
      targetId,
      targetType,
      metadata,
      description,
    });
    return this.actionsRepository.save(action);
  }

  async findByBoard(boardId: string, limit: number = 50): Promise<Action[]> {
    return this.actionsRepository.find({
      where: { boardId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByBoardAndUser(boardId: string, userId: string, limit: number = 50): Promise<Action[]> {
    return this.actionsRepository.find({
      where: { boardId, userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByTarget(targetId: string): Promise<Action[]> {
    return this.actionsRepository.find({
      where: { targetId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
