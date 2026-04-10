import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { BankAccount } from './entities/bank-account.entity';

@Module({
  imports: [
    // 使用默认数据库连接（开发环境简化）
    TypeOrmModule.forFeature([BankAccount]),
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}