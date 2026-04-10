import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { TaxRecord } from './entities/tax-record.entity';

@Module({
  imports: [
    // 使用账套数据库连接
    TypeOrmModule.forFeature([TaxRecord]),
  ],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}