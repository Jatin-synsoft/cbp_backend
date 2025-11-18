import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // important for Stripe
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // ⭐ Use RAW BODY ONLY for Stripe webhook
  app.use('/stripe/webhook', express.raw({ type: '*/*' }));

  // ⭐ For all other routes, use JSON parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix('api', { exclude: ['/', '/stripe/webhook'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  const config = new DocumentBuilder()
    .setTitle('Consultant Booking Platform API')
    .setDescription('NestJS backend for a consultant booking and scheduling platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(configService.get('PORT') || 3000);

  console.log(`🚀 Application is running on: http://localhost:${configService.get('PORT')}`);
}
bootstrap();
