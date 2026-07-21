import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureApplication } from './configure-application';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  const config = app.get(ConfigService);
  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
