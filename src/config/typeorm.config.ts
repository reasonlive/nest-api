import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { env } from 'process';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Article } from '../articles/entities/article.entity';
import { User } from '../auth/entities/user.entity';
config();

const AppDataSource: DataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT),
  username: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  //url: configService.get<string>('DATABASE_URL'),
  host: configService.get<string>('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USERNAME'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
  entities: [User, Article]
});