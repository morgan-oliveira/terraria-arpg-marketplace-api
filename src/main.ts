import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips non-defined properties
    transform: true,  // Transforms objects to DTO instances
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
