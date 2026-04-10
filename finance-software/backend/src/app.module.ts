import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { TenantModule } from './tenant/tenant.module';
import { AccountModule } from './account/account.module';
import { VoucherModule } from './voucher/voucher.module';
import { VoucherWordModule } from './voucher-word/voucher-word.module';
import { ReportModule } from './report/report.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TaxModule } from './tax/tax.module';
import { AccountBookModule } from './account-book/account-book.module';
import { PeriodModule } from './period/period.module';
import { PeriodEndModule } from './period-end/period-end.module';

@Module({
  imports: [
    // Passport 全局配置
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 使用文件型 SQLite（数据持久化）
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: './finance.db',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    // 业务模块
    AuthModule,
    CommonModule,
    TenantModule,
    AccountModule,
    VoucherModule,
    VoucherWordModule,
    ReportModule,
    InvoiceModule,
    TaxModule,
    AccountBookModule,
    PeriodModule,
    PeriodEndModule,
  ],
})
export class AppModule {}