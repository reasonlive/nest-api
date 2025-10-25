import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
