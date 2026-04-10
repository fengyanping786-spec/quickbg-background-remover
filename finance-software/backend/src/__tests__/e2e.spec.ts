/**
 * 财务系统 E2E 测试 - 核心功能验证
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('财务系统 E2E 测试', () => {
  let app: INestApplication;
  let createdVoucherId: string;
  let testTenantId = 'test_e2e_tenant';

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

  describe('1. 账套管理', () => {
    it('创建新账套', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/tenants')
        .send({
          code: 'TEST001',
          name: 'E2E测试账套',
          taxNo: '911100000000000001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      testTenantId = response.body.id;
    });

    it('查询账套列表 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/tenants')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('更新账套状态 - PUT', async () => {
      const response = await request(app.getHttpServer())
        .put(`/v1/tenants/${testTenantId}/status`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('2. 凭证字管理', () => {
    it('初始化凭证字 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/voucher-words/init?tenantId=${testTenantId}&year=2026`)
        .expect(201);

      expect(response.body).toBeDefined();
    });

    it('查询凭证字 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/voucher-words?tenantId=${testTenantId}&year=2026`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('3. 科目管理', () => {
    it('初始化科目 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/account-books/accounts/init?tenantId=${testTenantId}&year=2026`)
        .expect(201);

      expect(response.body).toBeDefined();
    });

    it('查询科目树 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/account-books/accounts/tree?tenantId=${testTenantId}&year=2026`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('4. 凭证管理', () => {
    it('创建凭证 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/vouchers')
        .send({
          tenantId: testTenantId,
          year: 2026,
          voucherDate: '2026-03-31',
          voucherWord: '记',
          remark: 'E2E测试',
          items: [
            { accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 5000 },
            { accountCode: '6001', accountName: '主营业务收入', direction: 'credit', amount: 5000 },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('draft');
      createdVoucherId = response.body.id;
    });

    it('审核凭证 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/vouchers/${createdVoucherId}/approve`)
        .send({ checkerId: 'test_user', checkerName: '测试员' })
        .expect(201);

      expect(response.body.status).toBe('approved');
    });

    it('过账凭证 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/vouchers/${createdVoucherId}/post`)
        .send({ posterId: 'test_user', posterName: '测试员' })
        .expect(201);

      expect(response.body.status).toBe('posted');
    });

    it('反过账 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/vouchers/${createdVoucherId}/unpost`)
        .expect(201);

      expect(response.body.status).toBe('approved');
    });

    it('反审核 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/vouchers/${createdVoucherId}/unapprove`)
        .expect(201);

      expect(response.body.status).toBe('draft');
    });

    it('查询凭证 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/vouchers?tenantId=${testTenantId}&year=2026`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('5. 辅助核算', () => {
    it('创建辅助核算类型 - POST', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/account-books/aux-types')
        .send({
          tenantId: testTenantId,
          code: 'department',
          name: '部门',
        })
        .expect(201);

      expect(response.body.code).toBe('department');
    });

    it('查询辅助核算类型 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/account-books/aux-types?tenantId=${testTenantId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('6. 账簿查询', () => {
    it('明细账 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/detail')
        .query({
          tenantId: testTenantId,
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

    it('总账 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/general')
        .query({
          tenantId: testTenantId,
          year: 2026,
          month: 3,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('科目余额表 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/account-books/balance')
        .query({
          tenantId: testTenantId,
          year: 2026,
          month: 3,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('7. 报表中心', () => {
    it('资产负债表 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/reports/balance-sheet')
        .query({
          tenantId: testTenantId,
          year: 2026,
          month: 3,
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('利润表 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/reports/profit-statement')
        .query({
          tenantId: testTenantId,
          year: 2026,
          month: 3,
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('现金流量表 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/reports/cash-flow')
        .query({
          tenantId: testTenantId,
          year: 2026,
          month: 3,
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('8. 期间管理', () => {
    it('当前期间 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/periods/current?tenantId=${testTenantId}&year=2026`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('9. 系统接口', () => {
    it('健康检查 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/system/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('系统信息 - GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/system/info')
        .expect(200);

      expect(response.body).toHaveProperty('version');
    });
  });
});