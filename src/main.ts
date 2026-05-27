import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips non-defined properties
    transform: true,  // Transforms objects to DTO instances
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Terraria ARPG Marketplace API')
    .setDescription('API para usuarios, autenticacao, itens, carrinhos, pedidos, pagamentos com coins e integracoes do mod.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Items')
    .addTag('Marketplace')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('App')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
