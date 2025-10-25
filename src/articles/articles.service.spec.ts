import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER, CacheModule, Cache } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleRepository } from './repositories/article.repository';
import { Article } from './entities/article.entity';
import { User } from '../auth/entities/user.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import {config} from 'dotenv';
import { createKeyv } from '@keyv/redis';
config()

const createTestDate = (): Date => new Date('2025-10-25T00:00:00.000Z');;

describe('ArticlesService', () => {
  let service: ArticlesService;
  let cacheManager: Cache;
  let module: TestingModule;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: createTestDate(),
    updatedAt: createTestDate(),
    articles: [],
  };

  const mockArticle: Article = {
    id: 1,
    title: 'Test Article',
    description: 'Test Description',
    content: 'Test Content',
    isPublished: true,
    createdAt: createTestDate(),
    updatedAt: createTestDate(),
    publishedAt: createTestDate(),
    author: mockUser,
    authorId: mockUser.id,
  };

  const mockArticleRepository = {
    findWithPagination: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          stores: [
            createKeyv(process.env.REDIS_URL)
          ],
          ttl: 60 * 60 * 1000,
        }),
      ],
      providers: [
        ArticlesService,
        {
          provide: ArticleRepository,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    cacheManager = module.get(CACHE_MANAGER);
    await cacheManager.clear();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close()
  });

  describe('findAll', () => {
    it('should return articles from cache if available', async () => {
      const query: ArticlesQueryDto = { page: 1, limit: 10 };
      const articlesResponse = {
        articles: [new ArticleResponseDto(mockArticle)],
        total: 1,
      };

      await cacheManager.set(
        'article:list:{"page":1,"limit":10}',
        JSON.stringify(articlesResponse)
      );

      const result = await service.findAll(query);

      expect(mockArticleRepository.findWithPagination).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        articles: [
          {
            id: 1,
            title: 'Test Article',
            description: 'Test Description',
            content: 'Test Content',
            isPublished: true,
            author: {
              id: 1,
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
        total: 1,
      });
    });

    it('should fetch from repository and cache result if not in cache', async () => {
      const query: ArticlesQueryDto = { page: 1, limit: 10 };
      const dbResult: [Article[], number] = [[mockArticle], 1];

      mockArticleRepository.findWithPagination.mockResolvedValue(dbResult);

      const result = await service.findAll(query);

      expect(mockArticleRepository.findWithPagination).toHaveBeenCalledWith(query);
      expect(result.articles).toHaveLength(1);
      expect(result.total).toBe(1);

      const cached = await cacheManager.get('article:list:{"page":1,"limit":10}') as string;

      expect(typeof cached).toBe('string');
      expect(JSON.parse(cached)).toMatchObject({
        articles: [
          {
            id: 1,
            title: 'Test Article',
            description: 'Test Description',
            content: 'Test Content',
            isPublished: true,
          },
        ],
        total: 1,
      });
    });

    it('should handle empty result', async () => {
      const query: ArticlesQueryDto = { page: 1, limit: 10 };
      const dbResult: [Article[], number] = [[], 0];

      mockArticleRepository.findWithPagination.mockResolvedValue(dbResult);

      const result = await service.findAll(query);

      expect(result.articles).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return article from cache if available', async () => {
      const articleResponse = new ArticleResponseDto(mockArticle);

      await cacheManager.set('article:1', JSON.stringify(articleResponse));

      const result = await service.findOne(1);

      expect(mockArticleRepository.findOneById).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 1,
        title: 'Test Article',
        description: 'Test Description',
        content: 'Test Content',
        isPublished: true,
        author: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should fetch from repository and cache if not in cache', async () => {
      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);

      const result = await service.findOne(1);

      expect(mockArticleRepository.findOneById).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(ArticleResponseDto);

      const cached = await cacheManager.get('article:1') as string;

      expect(typeof cached).toBe('string');
      expect(JSON.parse(cached)).toMatchObject({
        id: 1,
        title: 'Test Article',
        description: 'Test Description',
        content: 'Test Content',
        isPublished: true,
      });
    });

    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOneById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Article with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new article and invalidate cache', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New Description',
        content: 'New Content',
        isPublished: true,
      };

      const createdArticle: Article = {
        ...mockArticle,
        ...createArticleDto,
        id: 2,
        authorId: mockUser.id,
        publishedAt: createTestDate(),
      };

      await cacheManager.set('article:list:{"page":1,"limit":10}', 'cached-data');
      await cacheManager.set('article:list:{"page":2,"limit":10}', 'cached-data-2');

      mockArticleRepository.create.mockResolvedValue(createdArticle);

      const result = await service.create(createArticleDto, mockUser);

      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        {
          ...createArticleDto,
          authorId: mockUser.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          publishedAt: expect.any(Date)
        })

      const cachedAfterCreate1 = await cacheManager.get('article:list:{"page":1,"limit":10}') as string;
      const cachedAfterCreate2 = await cacheManager.get('article:list:{"page":2,"limit":10}') as string;
      expect(cachedAfterCreate1).toBeUndefined();
      expect(cachedAfterCreate2).toBeUndefined();

      expect(result).toBeInstanceOf(ArticleResponseDto);
    });

    it('should create draft article without publishedAt', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Draft Article',
        description: 'Draft Description',
        content: 'Draft Content',
        isPublished: false,
      };

      const createdArticle: Article = {
        ...mockArticle,
        ...createArticleDto,
        id: 3,
        authorId: mockUser.id,
        publishedAt: undefined,
      };

      mockArticleRepository.create.mockResolvedValue(createdArticle);

      await service.create(createArticleDto, mockUser);

      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createArticleDto.title,
          description: createArticleDto.description,
          content: createArticleDto.content,
          isPublished: false,
          authorId: mockUser.id,
          publishedAt: undefined,
        })
      );
    });
  });

  describe('update', () => {
    it('should update article if user is author', async () => {
      const updateDto: UpdateArticleDto = { title: 'Updated Title' };
      const updatedArticle = { ...mockArticle, ...updateDto };

      await cacheManager.set('article:1', 'cached-data');
      await cacheManager.set('article:list:{"page":1,"limit":10}', 'cached-list');

      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);
      mockArticleRepository.update.mockResolvedValue(updatedArticle);

      const result = await service.update(1, updateDto, mockUser);

      expect(mockArticleRepository.findOneById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.update).toHaveBeenCalledWith(1, updateDto);

      const cachedArticle = await cacheManager.get<string>('article:1');
      const cachedList = await cacheManager.get<string>('article:list:{"page":1,"limit":10}');
      expect(cachedArticle).toBeUndefined();
      expect(cachedList).toBeUndefined();

      expect(result.title).toBe('Updated Title');
    });

    it('should set publishedAt when publishing article', async () => {
      const draftArticle = { ...mockArticle, isPublished: false, publishedAt: null };
      const updateDto: UpdateArticleDto = { isPublished: true };
      const publishedArticle = {
        ...draftArticle,
        isPublished: true,
        publishedAt: createTestDate()
      };

      mockArticleRepository.findOneById.mockResolvedValue(draftArticle);
      mockArticleRepository.update.mockResolvedValue(publishedArticle);

       await service.update(1, updateDto, mockUser);

      expect(mockArticleRepository.update).toHaveBeenCalledWith(1, {
        isPublished: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        publishedAt: expect.any(Date)
      });
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const otherUser: User = { ...mockUser, id: 2 };
      const updateDto: UpdateArticleDto = { title: 'Updated Title' };

      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);

      await expect(service.update(1, updateDto, otherUser))
        .rejects.toThrow(ForbiddenException);
      await expect(service.update(1, updateDto, otherUser))
        .rejects.toThrow('You can only update your own articles');
    });

    it('should throw NotFoundException if article not found', async () => {
      const updateDto: UpdateArticleDto = { title: 'Updated Title' };

      mockArticleRepository.findOneById.mockResolvedValue(null);

      await expect(service.update(999, updateDto, mockUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete article if user is author', async () => {
      await cacheManager.set('article:1', 'cached-data');
      await cacheManager.set('article:list:{"page":1,"limit":10}', 'cached-list');

      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);

      await service.remove(1, mockUser);

      expect(mockArticleRepository.findOneById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.delete).toHaveBeenCalledWith(1);

      const cachedArticle = await cacheManager.get('article:1');
      const cachedList = await cacheManager.get('article:list:{"page":1,"limit":10}');
      expect(cachedArticle).toBeUndefined();
      expect(cachedList).toBeUndefined();
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const otherUser: User = { ...mockUser, id: 2 };

      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);

      await expect(service.remove(1, otherUser))
        .rejects.toThrow(ForbiddenException);
      await expect(service.remove(1, otherUser))
        .rejects.toThrow('You can only delete your own articles');
    });

    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOneById.mockResolvedValue(null);

      await expect(service.remove(999, mockUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('cache invalidation', () => {
    it('should clear all cache on create', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New Description',
        content: 'New Content',
        isPublished: true,
      };

      const createdArticle: Article = {
        ...mockArticle,
        ...createArticleDto,
        id: 2,
      };

      await cacheManager.set('article:list:{"page":1,"limit":10}', 'data1');
      await cacheManager.set('article:list:{"search":"test"}', 'data2');
      await cacheManager.set('article:1', 'data3');

      mockArticleRepository.create.mockResolvedValue(createdArticle);

      await service.create(createArticleDto, mockUser);

      const store = cacheManager.stores[0]?.iterator;
      expect(store && (await store('keyv').next()).done).toBeTruthy()
    });

    it('should clear specific article cache and list cache on update', async () => {
      const updateDto: UpdateArticleDto = { title: 'Updated' };
      const updatedArticle = { ...mockArticle, ...updateDto };

      await cacheManager.set('article:1', 'cached-article');
      await cacheManager.set('article:list:{"page":1}', 'cached-list1');
      await cacheManager.set('article:list:{"page":2}', 'cached-list2');
      await cacheManager.set('other:key', 'should-remain');

      mockArticleRepository.findOneById.mockResolvedValue(mockArticle);
      mockArticleRepository.update.mockResolvedValue(updatedArticle);

      await service.update(1, updateDto, mockUser);

      const store = cacheManager.stores[0]?.iterator;
      expect(store).not.toBeUndefined();
      if (store) {
        const value = (await store('keyv').next()).value as string[];
        expect(value?.length).toBe(2);
        expect(value[0]).toEqual('other:key');
      }
    });
  });
});