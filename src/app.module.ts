import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { getDatabaseConfig } from './config/typeorm.config';
import { getRedisConfig } from './config/redis.config';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: getRedisConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    ArticlesModule,
  ],
  controllers: [AppController]
})
export class AppModule {}
