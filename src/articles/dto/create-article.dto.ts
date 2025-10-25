import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ required: true, example: 'Introduction to NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: true, example: 'A comprehensive guide to NestJS framework' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: true, example: 'Full article content here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean = false;
}
