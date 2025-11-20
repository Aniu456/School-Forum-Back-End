import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { validationPipeConfig } from './../src/config/app.config';
import { AllExceptionsFilter } from './../src/common/filters';
import { TransformInterceptor } from './../src/common/interceptors';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 应用全局配置（与 main.ts 保持一致）
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(validationPipeConfig);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('status');
          expect(res.body.data).toHaveProperty('timestamp');
          expect(res.body.data).toHaveProperty('services');
        });
    });

    it('/health (GET) - should check database and redis', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.services).toHaveProperty('database');
          expect(res.body.data.services).toHaveProperty('redis');
        });
    });
  });
});
