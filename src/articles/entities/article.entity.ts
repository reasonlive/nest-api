import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => User, (user: User): Article[] => user.articles, {
    eager: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  @Exclude()
  authorId: number;
}
