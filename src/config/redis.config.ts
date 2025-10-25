import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';


export const getRedisConfig = (configService: ConfigService): CacheModuleOptions => ({
  stores: [
    createKeyv(configService.get<string>('REDIS_URL'))
  ],
  ttl: 60 * 60 * 1000,
});

