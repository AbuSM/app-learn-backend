import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
  ) {}

  async create(createCardDto: CreateCardDto, userId: string): Promise<Card> {
    const card = this.cardsRepository.create({
      ...createCardDto,
      createdById: userId,
    });
    return this.cardsRepository.save(card);
  }

  async findByList(listId: string): Promise<Card[]> {
    return this.cardsRepository.find({
      where: { listId },
      relations: ['createdBy', 'assignees', 'watchers', 'comments'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignees', 'watchers', 'comments', 'comments.author', 'list'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id);
    Object.assign(card, updateCardDto);
    return this.cardsRepository.save(card);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    await this.cardsRepository.remove(card);
  }

  async assignUser(cardId: string, userId: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const userExists = card.assignees?.some((u) => u.id === userId);
    if (!userExists) {
      if (!card.assignees) {
        card.assignees = [];
      }
      card.assignees.push({ id: userId } as User);
      return this.cardsRepository.save(card);
    }
    return card;
  }

  async unassignUser(cardId: string, userId: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    card.assignees = card.assignees?.filter((u) => u.id !== userId) || [];
    return this.cardsRepository.save(card);
  }

  async addWatcher(cardId: string, userId: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id: cardId },
      relations: ['watchers'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const watcherExists = card.watchers?.some((u) => u.id === userId);
    if (!watcherExists) {
      if (!card.watchers) {
        card.watchers = [];
      }
      card.watchers.push({ id: userId } as User);
      return this.cardsRepository.save(card);
    }
    return card;
  }

  async removeWatcher(cardId: string, userId: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id: cardId },
      relations: ['watchers'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    card.watchers = card.watchers?.filter((u) => u.id !== userId) || [];
    return this.cardsRepository.save(card);
  }

  async moveCard(cardId: string, newListId: string, newPosition: number): Promise<Card> {
    const card = await this.findOne(cardId);
    card.listId = newListId;
    card.position = newPosition;
    return this.cardsRepository.save(card);
  }

  async reorderCards(listId: string, cardIds: string[]): Promise<Card[]> {
    const cards = await this.cardsRepository.find({
      where: { listId },
    });

    const cardsMap = new Map(cards.map((card) => [card.id, card]));

    for (let i = 0; i < cardIds.length; i++) {
      const card = cardsMap.get(cardIds[i]);
      if (!card) {
        throw new BadRequestException(`Card with ID ${cardIds[i]} not found`);
      }
      card.position = i;
    }

    return this.cardsRepository.save(Array.from(cardsMap.values()));
  }
}
