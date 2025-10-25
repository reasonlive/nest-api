import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { User } from '../auth/entities/user.entity';
import { Article } from './entities/article.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ArticlesController', () => {
  let controller: ArticlesController;

  const mockUser: User = {
    id: 1,
    email: 'author@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    articles: [],
  };

  const mockArticle: Article = {
    id: 1,
    title: 'Test Article',
    description: 'Test Description',
    content: 'Test Content',
    isPublished: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    publishedAt: new Date('2023-01-01T00:00:00.000Z'),
    author: mockUser,
    authorId: mockUser.id,
  };

  const mockArticleResponse = new ArticleResponseDto(mockArticle);

  const mockArticlesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ArticlesController>(ArticlesController);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return articles with pagination', async () => {
      const queryDto = new ArticlesQueryDto();
      queryDto.page = 1;
      queryDto.limit = 10;

      const serviceResponse = {
        articles: [mockArticleResponse],
        total: 1,
      };

      mockArticlesService.findAll.mockResolvedValue(serviceResponse);

      const result = await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toBe(serviceResponse);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0]).toBeInstanceOf(ArticleResponseDto);
      expect(result.articles[0].id).toBe(1);
      expect(result.articles[0].title).toBe('Test Article');
    });

    it('should handle search query', async () => {
      const queryDto = new ArticlesQueryDto();
      queryDto.search = 'nestjs';
      queryDto.page = 1;
      queryDto.limit = 10;

      mockArticlesService.findAll.mockResolvedValue({
        articles: [mockArticleResponse],
        total: 1,
      });

      await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'nestjs',
          page: 1,
          limit: 10,
        })
      );
    });

    it('should handle authorId filter', async () => {
      const queryDto = new ArticlesQueryDto();
      queryDto.authorId = 1;
      queryDto.page = 1;
      queryDto.limit = 10;

      mockArticlesService.findAll.mockResolvedValue({
        articles: [mockArticleResponse],
        total: 1,
      });

      await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: 1,
        })
      );
    });

    it('should handle isPublished filter', async () => {
      const queryDto = new ArticlesQueryDto();
      queryDto.isPublished = true;
      queryDto.page = 1;
      queryDto.limit = 10;

      mockArticlesService.findAll.mockResolvedValue({
        articles: [mockArticleResponse],
        total: 1,
      });

      await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: true,
        })
      );
    });

    it('should handle date filters', async () => {
      const queryDto = new ArticlesQueryDto();
      queryDto.startDate = '2023-01-01';
      queryDto.endDate = '2023-12-31';

      mockArticlesService.findAll.mockResolvedValue({
        articles: [mockArticleResponse],
        total: 1,
      });

      await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        })
      );
    });

    it('should use default values when query parameters not provided', async () => {
      const queryDto = new ArticlesQueryDto();

      mockArticlesService.findAll.mockResolvedValue({
        articles: [mockArticleResponse],
        total: 1,
      });

      await controller.findAll(queryDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return article by ID', async () => {
      mockArticlesService.findOne.mockResolvedValue(mockArticleResponse);

      const result = await controller.findOne(1);

      expect(mockArticlesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockArticleResponse);
      expect(result).toBeInstanceOf(ArticleResponseDto);
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Article');
      expect(result.author).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
      });
    });

    it('should throw NotFoundException when article not found', async () => {
      mockArticlesService.findOne.mockRejectedValue(
        new NotFoundException('Article with ID 999 not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Article with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new article', async () => {
      const createArticleDto = new CreateArticleDto();
      createArticleDto.title = 'New Article';
      createArticleDto.description = 'New Description';
      createArticleDto.content = 'New Content';
      createArticleDto.isPublished = true;

      const createdArticle = new ArticleResponseDto({
        ...mockArticle,
        id: 2,
        title: 'New Article',
        description: 'New Description',
        content: 'New Content',
      });

      mockArticlesService.create.mockResolvedValue(createdArticle);

      const result = await controller.create(createArticleDto, { user: mockUser });

      expect(mockArticlesService.create).toHaveBeenCalledWith(createArticleDto, mockUser);
      expect(result).toBe(createdArticle);
      expect(result).toBeInstanceOf(ArticleResponseDto);
      expect(result.title).toBe('New Article');
      expect(result.description).toBe('New Description');
    });

    it('should create draft article when isPublished is false', async () => {
      const createArticleDto = new CreateArticleDto();
      createArticleDto.title = 'Draft Article';
      createArticleDto.description = 'Draft Description';
      createArticleDto.content = 'Draft Content';
      createArticleDto.isPublished = false;

      const createdArticle = new ArticleResponseDto({
        ...mockArticle,
        id: 3,
        title: 'Draft Article',
        isPublished: false,
        publishedAt: undefined,
      });

      mockArticlesService.create.mockResolvedValue(createdArticle);

      const result = await controller.create(createArticleDto, { user: mockUser });

      expect(mockArticlesService.create).toHaveBeenCalledWith(createArticleDto, mockUser);
      expect(result.isPublished).toBe(false);
      expect(result.publishedAt).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update article successfully', async () => {
      const updateArticleDto = new UpdateArticleDto();
      updateArticleDto.title = 'Updated Title';
      updateArticleDto.content = 'Updated Content';

      const updatedArticle = new ArticleResponseDto({
        ...mockArticle,
        title: 'Updated Title',
        content: 'Updated Content',
        updatedAt: new Date('2023-01-02T00:00:00.000Z'),
      });

      mockArticlesService.update.mockResolvedValue(updatedArticle);

      const result = await controller.update(1, updateArticleDto, { user: mockUser });

      expect(mockArticlesService.update).toHaveBeenCalledWith(1, updateArticleDto, mockUser);
      expect(result).toBe(updatedArticle);
      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated Content');
      expect(result).toBeInstanceOf(ArticleResponseDto);
    });

    it('should handle partial update', async () => {
      const updateArticleDto = new UpdateArticleDto();
      updateArticleDto.title = 'Only Title Updated';

      const updatedArticle = new ArticleResponseDto({
        ...mockArticle,
        title: 'Only Title Updated',
      });

      mockArticlesService.update.mockResolvedValue(updatedArticle);

      const result = await controller.update(1, updateArticleDto, { user: mockUser });

      expect(mockArticlesService.update).toHaveBeenCalledWith(1, updateArticleDto, mockUser);
      expect(result.title).toBe('Only Title Updated');
      // Остальные поля должны остаться прежними
      expect(result.description).toBe('Test Description');
      expect(result.content).toBe('Test Content');
    });

    it('should handle publishing article', async () => {
      const updateArticleDto = new UpdateArticleDto();
      updateArticleDto.isPublished = true;

      const publishedArticle = new ArticleResponseDto({
        ...mockArticle,
        isPublished: true,
        publishedAt: new Date('2023-01-02T00:00:00.000Z'),
      });

      mockArticlesService.update.mockResolvedValue(publishedArticle);

      const result = await controller.update(1, updateArticleDto, { user: mockUser });

      expect(result.isPublished).toBe(true);
      expect(result.publishedAt).toBeDefined();
    });

    it('should throw NotFoundException when article not found', async () => {
      const updateArticleDto = new UpdateArticleDto();
      updateArticleDto.title = 'Updated Title';

      mockArticlesService.update.mockRejectedValue(
        new NotFoundException('Article with ID 999 not found')
      );

      await expect(controller.update(999, updateArticleDto, { user: mockUser }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not author', async () => {
      const updateArticleDto = new UpdateArticleDto();
      updateArticleDto.title = 'Updated Title';

      mockArticlesService.update.mockRejectedValue(
        new ForbiddenException('You can only update your own articles')
      );

      await expect(controller.update(1, updateArticleDto, { user: mockUser }))
        .rejects.toThrow(ForbiddenException);
      await expect(controller.update(1, updateArticleDto, { user: mockUser }))
        .rejects.toThrow('You can only update your own articles');
    });
  });

  describe('remove', () => {
    it('should delete article successfully', async () => {
      mockArticlesService.remove.mockResolvedValue(undefined);

      await controller.remove(1, { user: mockUser });

      expect(mockArticlesService.remove).toHaveBeenCalledWith(1, mockUser);
    });

    it('should return 204 status code on successful deletion', async () => {
      mockArticlesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, { user: mockUser });

      expect(result).toBeUndefined();
      expect(mockArticlesService.remove).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when article not found', async () => {
      mockArticlesService.remove.mockRejectedValue(
        new NotFoundException('Article with ID 999 not found')
      );

      await expect(controller.remove(999, { user: mockUser }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not author', async () => {
      mockArticlesService.remove.mockRejectedValue(
        new ForbiddenException('You can only delete your own articles')
      );

      await expect(controller.remove(1, { user: mockUser }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('ArticleResponseDto structure', () => {
    it('should have correct author structure in response', async () => {
      mockArticlesService.findOne.mockResolvedValue(mockArticleResponse);

      const result = await controller.findOne(1);

      expect(result.author).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
      });
      expect(result.author).not.toHaveProperty('password');
      expect(result.author).not.toHaveProperty('createdAt');
      expect(result.author).not.toHaveProperty('updatedAt');
    });

    it('should handle article without publishedAt', async () => {
      const draftArticle = new ArticleResponseDto({
        ...mockArticle,
        isPublished: false,
        publishedAt: undefined,
      });

      mockArticlesService.findOne.mockResolvedValue(draftArticle);

      const result = await controller.findOne(2);

      expect(result.isPublished).toBe(false);
      expect(result.publishedAt).toBeUndefined();
    });
  });
});