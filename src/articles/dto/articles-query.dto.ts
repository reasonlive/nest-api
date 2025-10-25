import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ArticlesQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, description: 'Page articles limit' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Part of a sting to search in titles and descriptions' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Author unique ID' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  authorId?: number;

  @ApiProperty({ required: false, description: "Published or not flag" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  isPublished?: boolean;

  @ApiProperty({ required: false, description: 'Date before article created' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Date after article created' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
