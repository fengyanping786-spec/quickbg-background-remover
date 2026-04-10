import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ExportService } from './export.service';
import { ExcelExportService } from '../common/excel-export.service';
import { Voucher } from '../voucher/entities/voucher.entity';
import { VoucherItem } from '../voucher/entities/voucher-item.entity';

@Module({
  imports: [
    // 使用账套数据库连接
    TypeOrmModule.forFeature([Voucher, VoucherItem]),
  ],
  controllers: [ReportController],
  providers: [ReportService, ExportService, ExcelExportService],
})
export class ReportModule {}