import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherWord } from './entities/voucher-word.entity';
import { VoucherWordService } from './voucher-word.service';
import { VoucherWordController } from './voucher-word.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherWord])],
  providers: [VoucherWordService],
  controllers: [VoucherWordController],
  exports: [VoucherWordService],
})
export class VoucherWordModule {}