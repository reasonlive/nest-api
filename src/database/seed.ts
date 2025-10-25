import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.create(DatabaseModule);
  await app.get(SeedService).seed();
  await app.close();
}

bootstrap();