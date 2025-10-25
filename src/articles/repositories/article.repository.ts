import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { ArticlesQueryDto } from '../dto/articles-query.dto';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  async findWithPagination(
    query: ArticlesQueryDto,
  ): Promise<[Article[], number]> {
    const skip: number = query.page && query.limit ? (query.page - 1) * query.limit : 0;

    const qb: SelectQueryBuilder<Article> = this.repository.createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    if (query.search) {
      qb.andWhere('(article.title ILIKE :search OR article.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId: query.authorId });
    }

    if (query.isPublished !== undefined) {
      qb.andWhere('article.isPublished = :isPublished', {
        isPublished: query.isPublished,
      });
    }

    if (query.startDate) {
      qb.andWhere('article.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('article.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('article.createdAt', 'DESC')
      .skip(skip)
      .take(query.limit);

    return qb.getManyAndCount();
  }

  async findOneById(id: number): Promise<Article | null> {
    return this.repository.findOne({
      where: {id},
      relations: ['author'],
    });
  }

  async create(articleData: Partial<Article>): Promise<Article> {
    const article = this.repository.create(articleData);
    return this.repository.save(article);
  }

  async update(id: number, articleData: Partial<Article>): Promise<Article | null> {
    await this.repository.update(id, articleData);
    return this.findOneById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.repository.count({where: {id}});
    return count > 0;
  }
}