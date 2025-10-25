import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Article } from './entities/article.entity';
import { ArticleRepository } from './repositories/article.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ArticlesService {
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'article';

  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(id: number): string {
    return `${this.CACHE_PREFIX}:${id}`;
  }

  private getListCacheKey(query: ArticlesQueryDto): string {
    return `${this.CACHE_PREFIX}:list:${JSON.stringify(query)}`;
  }

  async findAll(query: ArticlesQueryDto): Promise<{ articles: ArticleResponseDto[]; total: number }> {
    const cacheKey = this.getListCacheKey(query);
    const cached = await this.cacheManager.get(cacheKey) as string;

    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(cached);
    }

    const [articles, total] = await this.articleRepository.findWithPagination(query);
    const result = {
      articles: articles.map(article => new ArticleResponseDto(article)),
      total,
    };

    await this.cacheManager.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    return result;
  }

  async findOne(id: number): Promise<ArticleResponseDto> {
    const cacheKey = this.getCacheKey(id);
    const cached = await this.cacheManager.get(cacheKey) as string;

    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(cached);
    }

    const article = await this.articleRepository.findOneById(id);
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const result = new ArticleResponseDto(article);
    await this.cacheManager.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    return result;
  }

  async create(createArticleDto: CreateArticleDto, user: User): Promise<ArticleResponseDto> {
    const articleData: Partial<Article> = {
      ...createArticleDto,
      authorId: user.id,
      publishedAt: createArticleDto.isPublished ? new Date() : undefined,
    };

    const article = await this.articleRepository.create(articleData);
    await this.invalidateListCache();
    return new ArticleResponseDto(article, user);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto, user: User): Promise<ArticleResponseDto> {
    const existingArticle = await this.articleRepository.findOneById(id);
    if (!existingArticle) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    if (existingArticle.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updateData: Partial<Article> = { ...updateArticleDto };

    if (updateArticleDto.isPublished && !existingArticle.isPublished) {
      updateData.publishedAt = new Date();
    }

    const article: Article|null = await this.articleRepository.update(id, updateData);
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    await this.cacheManager.del(this.getCacheKey(id));
    await this.invalidateListCache();

    return new ArticleResponseDto(article);
  }

  async remove(id: number, user: User): Promise<void> {
    const existingArticle = await this.articleRepository.findOneById(id);
    if (!existingArticle) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    if (existingArticle.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.articleRepository.delete(id);

    // Invalidate cache
    await this.cacheManager.del(this.getCacheKey(id));
    await this.invalidateListCache();
  }

  private async invalidateListCache(): Promise<void> {
    const store = this.cacheManager.stores[0]?.iterator;
    if (store) {
      for await (const [key] of store('keyv')) {
        if (typeof key === 'string' && key.startsWith(this.CACHE_PREFIX)) {
          await this.cacheManager.del(key);
        }
      }
    }
  }
}