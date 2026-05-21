import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({ origin: true, credentials: true });

  // 静态资源（非遗视频等）：GET /static/<文件名>。
  // 用 process.cwd()（后端从 backend/ 启动）—— nest start 不一定从 dist/ 跑，__dirname 不可靠。
  app.useStaticAssets(join(process.cwd(), 'static'), { prefix: '/static/' });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TripGo API')
    .setDescription('文脉粤游 后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(config.get('PORT')) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API:  http://localhost:${port}`);
  console.log(`Docs: http://localhost:${port}/docs`);
}
bootstrap();
