import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';

/**
 * 系统集成测试 - 测试核心业务流程
 * 
 * 测试场景：
 * 1. 账套管理 - 创建、查询、启用/停用
 * 2. 科目管理 - 初始化、查询
 * 3. 凭证管理 - 创建、审核、过账
 * 4. 账簿查询 - 明细账、总账
 */
describe('财务系统集成测试 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('账套管理模块', () => {
    it('GET /v1/tenants - 应返回账套列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/tenants')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /v1/tenants - 应能创建新账套', async () => {
      const createDto = {
        code: 'TEST001',
        name: '测试账套有限公司',
        taxNo: '911100000000000000',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区测试路1号',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/tenants')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe('TEST001');
    });
  });

  describe('凭证字管理模块', () => {
    it('GET /v1/voucher-words - 应返回凭证字列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/voucher-words?tenantId=default&year=2026')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /v1/voucher-words/init - 应能初始化默认凭证字', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/voucher-words/init?tenantId=default&year=2026')
        .expect(201);

      expect(response.body).toBeDefined();
    });
  });

  describe('凭证管理模块', () => {
    it('GET /v1/vouchers - 应返回凭证列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/vouchers')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /v1/vouchers - 应能创建凭证', async () => {
      const createDto = {
        voucherDate: '2026-03-31',
        remark: '系统测试凭证',
        items: [
          { accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 5000 },
          { accountCode: '6001', accountName: '主营业务收入', direction: 'credit', amount: 5000 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/v1/vouchers')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('draft');
    });
  });

  describe('科目管理模块', () => {
    it('GET /v1/account-books/accounts - 应返回科目列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/accounts?year=2026')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('辅助核算模块', () => {
    it('GET /v1/account-books/aux-types - 应返回辅助核算类型', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/aux-types?tenantId=default')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /v1/account-books/aux-types - 应能创建辅助核算类型', async () => {
      const createDto = {
        tenantId: 'default',
        code: 'department',
        name: '部门',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/account-books/aux-types')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('department');
    });
  });

  describe('账簿查询模块', () => {
    it('GET /v1/account-books/detail - 应能查询明细账', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/detail')
        .query({
          tenantId: 'default',
          year: 2026,
          accountCode: '1001',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          page: 1,
          pageSize: 50,
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
    });

    it('GET /v1/account-books/general - 应能查询总账', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/general')
        .query({
          tenantId: 'default',
          year: 2026,
          month: 3,
        })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('报表模块', () => {
    it('GET /v1/reports/balance-sheet - 应能生成资产负债表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/reports/balance-sheet')
        .query({
          tenantId: 'default',
          year: 2026,
          month: 3,
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
    });

    it('GET /v1/reports/profit-statement - 应能生成利润表', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/reports/profit-statement')
        .query({
          tenantId: 'default',
          year: 2026,
          month: 3,
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
  });
});