import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus, Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'authorId', required: false, type: Number })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  async findAll(@Query() query: ArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully', type: ArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Param('id') id: number): Promise<ArticleResponseDto> {
    return this.articlesService.findOne(id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully', type: ArticleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: { user: User },
  ): Promise<ArticleResponseDto> {
    return this.articlesService.create(createArticleDto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article by ID' })
  @ApiResponse({ status: 200, description: 'Article updated successfully', type: ArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own articles' })
  async update(
    @Param('id') id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: { user: User },
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(id, updateArticleDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article by ID' })
  @ApiResponse({ status: 204, description: 'Article deleted successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own articles' })
  async remove(
    @Param('id') id: number,
    @Request() req: { user: User },
  ): Promise<void> {
    return this.articlesService.remove(id, req.user);
  }
}