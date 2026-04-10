import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

export interface MultiColumnBookItem {
  accountCode: string;
  accountName: string;
  items: {
    date: string;
    voucherNo: string;
    description: string;
    debit1: number;
    debit2: number;
    debit3: number;
    credit1: number;
    credit2: number;
    credit3: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

@Injectable()
export class MultiColumnBookService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  // 多栏账查询 - 按明细科目多栏显示
  async getMultiColumnBook(
    tenantId: string,
    year: number,
    accountCode: string,
    startDate: string,
    endDate: string,
  ): Promise<MultiColumnBookItem> {
    // Mock 实现 - 实际应按辅助核算项目分列
    const mockData: MultiColumnBookItem = {
      accountCode: accountCode || '6602',
      accountName: '管理费用',
      items: [
        { date: '2026-03-05', voucherNo: 'JZ-0001', description: '办公费', debit1: 1000, debit2: 0, debit3: 0, credit1: 0, credit2: 0, credit3: 0 },
        { date: '2026-03-10', voucherNo: 'JZ-0002', description: '差旅费', debit1: 0, debit2: 2000, debit3: 0, credit1: 0, credit2: 0, credit3: 0 },
        { date: '2026-03-15', voucherNo: 'JZ-0003', description: '水电费', debit1: 0, debit2: 0, debit3: 500, credit1: 0, credit2: 0, credit3: 0 },
      ],
      totalDebit: 3500,
      totalCredit: 0,
      balance: 3500,
    };

    return mockData;
  }

  // 获取支持多栏账的科目列表（费用类科目）
  async getMultiColumnAccounts(tenantId: string, year: number): Promise<Account[]> {
    // 筛选可以设置多栏账的科目（一般管理费用、销售费用等）
    return this.accountRepository.find({
      where: { 
        tenantId: tenantId || undefined,
        code: require('typeorm').MoreThanOrEqual('6601'),
      },
      order: { code: 'ASC' },
    });
  }
}