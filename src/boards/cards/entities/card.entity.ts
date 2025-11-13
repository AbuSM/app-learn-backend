import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { List } from '../../lists/entities/list.entity';
import { User } from '../../../users/entities/user.entity';
import { CardComment } from '../../comments/entities/card-comment.entity';
import { CardPriority, CardStatus } from '../../../common/enums';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: CardPriority,
    default: CardPriority.MEDIUM,
  })
  priority: CardPriority;

  @Column({
    type: 'enum',
    enum: CardStatus,
    default: CardStatus.TODO,
  })
  status: CardStatus;

  @Column()
  position: number;

  @Column({ name: 'list_id' })
  listId: string;

  @ManyToOne(() => List, (list) => list.cards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'list_id' })
  list: List;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'card_assignees',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignees: User[];

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'card_watchers',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  watchers: User[];

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  estimatedHours: number;

  @Column({ nullable: true })
  spentHours: number;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  labels: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CardComment, (comment) => comment.card, { cascade: true })
  comments: CardComment[];
}
