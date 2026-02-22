import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  process.env.TZ = 'America/Lima';
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Prestamos API')
    .setDescription('The Prestamos API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS with restricted origins
  const allowedOriginsString = configService.get<string>('ALLOWED_ORIGINS');
  const origins = allowedOriginsString
    ? allowedOriginsString.split(',').map((o) => o.trim())
    : true; // Default to true if not defined (matching previous behavior but manageable)

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Error starting server', err);
  process.exit(1);
});
