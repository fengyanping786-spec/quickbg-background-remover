import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account, AuxType, AuxItem, OpeningBalance } from './entities/account.entity';
import { AccountBookService } from './account-book.service';
import { AccountBookController } from './account-book.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account, AuxType, AuxItem, OpeningBalance])],
  controllers: [AccountBookController],
  providers: [AccountBookService],
  exports: [AccountBookService],
})
export class AccountBookModule {}