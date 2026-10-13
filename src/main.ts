import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH_TOKEN } from './auth/guards/auth.guard.js';

// Extend Express User interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      image?: string;
    }
  }
}

let serverlessApp: any;

export async function createNestServer() {
  if (!serverlessApp) {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const frontendUrl = configService.get<string>('frontendUrl') || '*';

    app.setGlobalPrefix('api/v1', { exclude: ['/'] });
    app.use(helmet());

    const allowedOrigins = [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];
    app.enableCors({
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
          return;
        }
        callback(null, true);
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      optionsSuccessStatus: 204,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    const betterAuthInstance = app.get(BETTER_AUTH_TOKEN);
    app.use('/api/v1/auth', toNodeHandler(betterAuthInstance));

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gekko Community API')
      .setDescription('Production backend API for the Gekko Community platform.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    serverlessApp = app.getHttpAdapter().getInstance();
  }
  return serverlessApp;
}

export default async function handler(req: any, res: any) {
  const server = await createNestServer();
  return server(req, res);
}

async function bootstrap() {
  if (process.env.VERCEL) {
    return;
  }
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');
  const frontendUrl = configService.getOrThrow<string>('frontendUrl');

  // Set global API prefix
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // Security headers
  app.use(helmet());

  // CORS configuration - credentialed requests with explicit origin
  const allowedOrigins = [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Better Auth Integration
  const betterAuthInstance = app.get(BETTER_AUTH_TOKEN);
  app.use('/api/v1/auth', toNodeHandler(betterAuthInstance));

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gekko Community API')
    .setDescription('Production backend API for the Gekko Community platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Gekko server started on port ${port}`);
  console.log(`Environment: ${configService.getOrThrow<string>('nodeEnv')}`);
  console.log(`Frontend URL: ${frontendUrl}`);
}

await bootstrap();
