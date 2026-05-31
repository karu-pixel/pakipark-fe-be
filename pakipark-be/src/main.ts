import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, static as serveStatic, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const clientUrl = process.env.CLIENT_URL;

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));
  app.use('/uploads', serveStatic(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) => {
      if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      if (clientUrl && origin === clientUrl) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running on: http://localhost:${port}`);
}
bootstrap();
