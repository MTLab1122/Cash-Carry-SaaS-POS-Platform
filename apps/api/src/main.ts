import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ProblemDetailsFilter } from './common/filters/problem-details-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. HTTP Security Hardening (Helmet, CSP, HSTS, Frameguard)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
    }),
  );

  // 2. Strict CORS Lockdown
  const rawOrigins =
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. desktop Electron app, mobile Flutter, CLI, curl)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        logger.warn(`CORS rejected for unlisted origin: ${origin}`);
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Idempotency-Key',
      'X-Trace-ID',
    ],
  });

  // 3. Global Prefix & Exception Filter (RFC 7807 Problem Details)
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ProblemDetailsFilter());

  // 4. Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 5. Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Enterprise Cash & Carry SaaS API')
    .setDescription(
      'Production-grade Multi-Tenant POS & Management API for Supermarkets and Retailers',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Cash & Carry SaaS Backend API running at http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
