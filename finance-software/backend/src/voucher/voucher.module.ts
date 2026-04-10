import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { AttachmentService } from './attachment.service';
import { Voucher } from './entities/voucher.entity';
import { VoucherItem } from './entities/voucher-item.entity';
import { VoucherTemplate } from './entities/voucher-template.entity';

@Module({
  imports: [
    // 使用账套数据库连接
    TypeOrmModule.forFeature([Voucher, VoucherItem, VoucherTemplate]),
  ],
  controllers: [VoucherController],
  providers: [VoucherService, AttachmentService],
  exports: [VoucherService, AttachmentService],
})
export class VoucherModule {}