import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
  .setTitle('Nest API')
  .setDescription('Nest API for articles')
  .setVersion('1.0')
  .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();