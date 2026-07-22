import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/swagger/openapi';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api/v1'));
  const document = buildOpenApiDocument(
    app,
    config.get<string>('SWAGGER_SERVER_URL', 'http://localhost:3000'),
  );
  const outputDirectory = resolve(process.cwd(), 'docs/api');
  const outputPath = resolve(outputDirectory, 'openapi.json');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
  process.stdout.write(`Generated ${outputPath}\n`);
}

void generate();
