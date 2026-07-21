import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { buildOpenApiDocument } from './swagger/openapi';

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api/v1'));
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
