import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import AppDataSource from '../config/typeorm.config';
import { SeedService } from './seed.service';
import { Article } from '../articles/entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([User, Article])
  ],
  providers: [SeedService]
})
export class DatabaseModule {}
