import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardComment } from '../entities/card-comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CardComment)
    private commentsRepository: Repository<CardComment>,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: string): Promise<CardComment> {
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      authorId: userId,
    });
    return this.commentsRepository.save(comment);
  }

  async findByCard(cardId: string): Promise<CardComment[]> {
    return this.commentsRepository.find({
      where: { cardId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CardComment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'card'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CardComment> {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only update your own comments');
    }

    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only delete your own comments');
    }

    await this.commentsRepository.remove(comment);
  }
}
