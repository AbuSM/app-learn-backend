import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity';
import { BoardMember } from '../../boards/entities/board-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspaceMemberships: WorkspaceMember[];

  @OneToMany(() => BoardMember, (member) => member.user)
  boardMemberships: BoardMember[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
