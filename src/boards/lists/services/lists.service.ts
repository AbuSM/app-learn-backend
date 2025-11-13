import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from '../entities/list.entity';
import { CreateListDto } from '../dto/create-list.dto';
import { UpdateListDto } from '../dto/update-list.dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private listsRepository: Repository<List>,
  ) {}

  async create(createListDto: CreateListDto): Promise<List> {
    const list = this.listsRepository.create({
      ...createListDto,
    });
    return this.listsRepository.save(list);
  }

  async findByBoard(boardId: string): Promise<List[]> {
    return this.listsRepository.find({
      where: { boardId, isActive: true },
      relations: ['cards'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<List> {
    const list = await this.listsRepository.findOne({
      where: { id, isActive: true },
      relations: ['cards'],
    });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: string, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(id);
    Object.assign(list, updateListDto);
    return this.listsRepository.save(list);
  }

  async remove(id: string): Promise<void> {
    const list = await this.findOne(id);
    list.isActive = false;
    await this.listsRepository.save(list);
  }

  async reorderLists(boardId: string, listIds: string[]): Promise<List[]> {
    const lists = await this.listsRepository.find({
      where: { boardId },
    });

    const listsMap = new Map(lists.map((list) => [list.id, list]));

    for (let i = 0; i < listIds.length; i++) {
      const list = listsMap.get(listIds[i]);
      if (!list) {
        throw new BadRequestException(`List with ID ${listIds[i]} not found`);
      }
      list.position = i;
    }

    return this.listsRepository.save(Array.from(listsMap.values()));
  }
}
