import { ApiProperty } from '@nestjs/swagger';
import { Article } from '../entities/article.entity';
import { User } from '../../auth/entities/user.entity';

export class ArticleResponseDto {
  @ApiProperty({description: 'Article unique ID'})
  id: number;

  @ApiProperty({description: 'Article title'})
  title: string;

  @ApiProperty({description: 'Article description'})
  description: string;

  @ApiProperty({description: 'Article content'})
  content: string;

  @ApiProperty({description: 'Published article or not'})
  isPublished: boolean;

  @ApiProperty({description: 'When article was created'})
  createdAt: Date;

  @ApiProperty({description: 'When article was updated'})
  updatedAt: Date;

  @ApiProperty({required: false, description: 'When article was published'})
  publishedAt?: Date|undefined;

  @ApiProperty({description: "User who created the article"})
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }

  constructor(article: Article, author?: User) {
    this.id = article.id;
    this.title = article.title;
    this.description = article.description;
    this.content = article.content;
    this.isPublished = article.isPublished;
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
    this.publishedAt = article.publishedAt;
    this.author = {
      id: author?.id ?? article.author?.id,
      firstName: author?.firstName ?? article.author?.firstName,
      lastName: author?.lastName ?? article.author?.lastName,
      email: author?.email ?? article.author?.email,
    };
  }
}