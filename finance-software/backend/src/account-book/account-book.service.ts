import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Account, AuxType, AuxItem, OpeningBalance } from './entities/account.entity';

export interface DetailBookItem {
  voucherNo: string;
  voucherDate: string;
  lineNo: number;
  description: string;
  accountCode: string;
  accountName: string;
  direction: string;
  amount: number;
  balance: number;
}

export interface GeneralLedgerItem {
  accountCode: string;
  accountName: string;
  direction: string;
  openingBalance: number;
  debitAmount: number;
  creditAmount: number;
  closingBalance: number;
}

export interface CashBookItem {
  voucherNo: string;
  voucherDate: string;
  description: string;
  accountCode: string;
  accountName: string;
  direction: string;
  amount: number;
  balance: number;
}

export interface AccountBalanceItem {
  accountCode: string;
  accountName: string;
  level: number;
  direction: string;
  openingBalance: number;
  debitAmount: number;
  creditAmount: number;
  closingBalance: number;
}

// 标准会计科目模板
const DEFAULT_ACCOUNTS = [
  // 资产类 (1开头)
  { code: '1001', name: '银行存款', level: 3, direction: 'debit', isCash: true },
  { code: '1002', name: '库存现金', level: 3, direction: 'debit', isCash: true },
  { code: '1012', name: '其他货币资金', level: 3, direction: 'debit' },
  { code: '1122', name: '应收账款', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'customer' },
  { code: '1123', name: '应收票据', level: 3, direction: 'debit' },
  { code: '1403', name: '原材料', level: 3, direction: 'debit', isQuantity: true, unit: '批' },
  { code: '1405', name: '原材料', level: 3, direction: 'debit' },
  { code: '1601', name: '固定资产', level: 3, direction: 'debit', isQuantity: true, unit: '台' },
  { code: '1602', name: '累计折旧', level: 3, direction: 'credit' },
  { code: '1604', name: '在建工程', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'project' },
  { code: '1801', name: '无形资产', level: 3, direction: 'debit' },
  { code: '1901', name: '长期待摊费用', level: 3, direction: 'debit' },

  // 负债类 (2开头)
  { code: '2001', name: '短期借款', level: 3, direction: 'credit' },
  { code: '2201', name: '应付票据', level: 3, direction: 'credit' },
  { code: '2202', name: '应付账款', level: 3, direction: 'credit', isAuxiliary: true, auxType: 'supplier' },
  { code: '2211', name: '应付职工薪酬', level: 3, direction: 'credit' },
  { code: '2221', name: '应交税费', level: 3, direction: 'credit' },
  { code: '222101', name: '增值税', level: 4, direction: 'credit', parentCode: '2221' },
  { code: '222102', name: '所得税', level: 4, direction: 'credit', parentCode: '2221' },
  { code: '2232', name: '应付股利', level: 3, direction: 'credit' },
  { code: '2501', name: '长期借款', level: 3, direction: 'credit' },

  // 所有者权益类 (4开头)
  { code: '4001', name: '实收资本', level: 3, direction: 'credit' },
  { code: '4002', name: '资本公积', level: 3, direction: 'credit' },
  { code: '4101', name: '盈余公积', level: 3, direction: 'credit' },
  { code: '4103', name: '本年利润', level: 3, direction: 'credit' },
  { code: '4104', name: '利润分配', level: 3, direction: 'credit' },

  // 成本类 (5开头)
  { code: '5001', name: '生产成本', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'department' },
  { code: '5101', name: '制造费用', level: 3, direction: 'debit' },

  // 损益类 (6开头) - 收入
  { code: '6001', name: '主营业务收入', level: 3, direction: 'credit', isAuxiliary: true, auxType: 'project' },
  { code: '6051', name: '其他业务收入', level: 3, direction: 'credit' },
  { code: '6111', name: '投资收益', level: 3, direction: 'credit' },
  { code: '6301', name: '营业外收入', level: 3, direction: 'credit' },

  // 损益类 - 费用
  { code: '6401', name: '主营业务成本', level: 3, direction: 'debit' },
  { code: '6402', name: '其他业务成本', level: 3, direction: 'debit' },
  { code: '6403', name: '税金及附加', level: 3, direction: 'debit' },
  { code: '6601', name: '销售费用', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'department' },
  { code: '6602', name: '管理费用', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'department' },
  { code: '6603', name: '财务费用', level: 3, direction: 'debit' },
  { code: '6711', name: '营业外支出', level: 3, direction: 'debit' },
  { code: '6801', name: '所得税费用', level: 3, direction: 'debit' },
];

@Injectable()
export class AccountBookService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(AuxType)
    private auxTypeRepository: Repository<AuxType>,
    @InjectRepository(AuxItem)
    private auxItemRepository: Repository<AuxItem>,
    @InjectRepository(OpeningBalance)
    private openingBalanceRepository: Repository<OpeningBalance>,
  ) {}

  // ========== 科目管理 ==========

  // 初始化科目（如果不存在）
  async initDefaultAccounts(tenantId?: string, year?: number): Promise<number> {
    const existingCount = await this.accountRepository.count();
    if (existingCount > 0) {
      return 0; // 已初始化
    }

    let created = 0;
    for (const acc of DEFAULT_ACCOUNTS) {
      const exists = await this.accountRepository.findOne({ where: { code: acc.code } });
      if (!exists) {
        const account = this.accountRepository.create({
          tenantId: tenantId || null,
          year: year || null,
          code: acc.code,
          name: acc.name,
          level: acc.level,
          parentCode: acc.parentCode || null,
          direction: acc.direction as 'debit' | 'credit',
          isAuxiliary: acc.isAuxiliary || false,
          auxType: acc.auxType || null,
          isCash: acc.isCash || false,
          isQuantity: acc.isQuantity || false,
          unit: acc.unit || null,
          isActive: true,
          openingBalance: 0,
        });
        await this.accountRepository.save(account);
        created++;
      }
    }
    return created;
  }

  // 获取科目树
  async getAccountTree(tenantId?: string, year?: number): Promise<Account[]> {
    return this.accountRepository.find({
      where: { tenantId: tenantId || undefined, year: year || undefined },
      order: { code: 'ASC' },
    });
  }

  // 获取所有活跃科目
  async getAccounts(tenantId?: string, year?: number): Promise<Account[]> {
    return this.accountRepository.find({
      where: { tenantId: tenantId || undefined, year: year || undefined, isActive: true },
      order: { code: 'ASC' },
    });
  }

  // 创建科目
  async createAccount(data: Partial<Account>): Promise<Account> {
    const account = this.accountRepository.create(data);
    return this.accountRepository.save(account);
  }

  // 更新科目
  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('科目不存在');
    Object.assign(account, data);
    return this.accountRepository.save(account);
  }

  // 删除科目
  async deleteAccount(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('科目不存在');
    await this.accountRepository.remove(account);
  }

  // ========== 期初余额管理 ==========

  // 设置期初余额
  async setOpeningBalance(data: {
    tenantId?: string;
    year: number;
    accountCode: string;
    debitBalance?: number;
    creditBalance?: number;
    auxType?: string;
    auxItemCode?: string;
  }): Promise<OpeningBalance> {
    const { tenantId, year, accountCode, debitBalance = 0, creditBalance = 0, auxType, auxItemCode } = data;

    // 查找现有记录
    let balance = await this.openingBalanceRepository.findOne({
      where: {
        tenantId: tenantId || undefined,
        year,
        accountCode,
        auxType: auxType || undefined,
        auxItemCode: auxItemCode || undefined,
      },
    });

    if (balance) {
      balance.debitBalance = debitBalance;
      balance.creditBalance = creditBalance;
    } else {
      balance = this.openingBalanceRepository.create({
        tenantId: tenantId || null,
        year,
        accountCode,
        debitBalance,
        creditBalance,
        auxType: auxType || null,
        auxItemCode: auxItemCode || null,
      });
    }

    return this.openingBalanceRepository.save(balance);
  }

  // 获取期初余额
  async getOpeningBalances(tenantId: string, year: number): Promise<OpeningBalance[]> {
    return this.openingBalanceRepository.find({
      where: { tenantId: tenantId || undefined, year },
      order: { accountCode: 'ASC' },
    });
  }

  // 删除期初余额
  async deleteOpeningBalance(id: string): Promise<void> {
    const balance = await this.openingBalanceRepository.findOne({ where: { id } });
    if (!balance) throw new NotFoundException('期初余额记录不存在');
    await this.openingBalanceRepository.remove(balance);
  }

  // ========== 辅助核算管理 ==========

  // 获取辅助核算类型
  async getAuxTypes(tenantId?: string): Promise<AuxType[]> {
    return this.auxTypeRepository.find({
      where: { tenantId: tenantId || undefined },
      order: { code: 'ASC' },
    });
  }

  // 创建辅助核算类型
  async createAuxType(data: Partial<AuxType>): Promise<AuxType> {
    const auxType = this.auxTypeRepository.create(data);
    return this.auxTypeRepository.save(auxType);
  }

  // 获取辅助核算项目
  async getAuxItems(tenantId: string, auxTypeCode: string): Promise<AuxItem[]> {
    return this.auxItemRepository.find({
      where: { tenantId: tenantId || undefined, auxTypeCode },
      order: { code: 'ASC' },
    });
  }

  // 创建辅助核算项目
  async createAuxItem(data: Partial<AuxItem>): Promise<AuxItem> {
    const auxItem = this.auxItemRepository.create(data);
    return this.auxItemRepository.save(auxItem);
  }

  // ========== 账簿查询 ==========

  // 明细账查询
  async getDetailBook(
    tenantId: string,
    year: number,
    accountCode: string,
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
  ): Promise<{ data: DetailBookItem[]; total: number }> {
    const mockData: DetailBookItem[] = [
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', lineNo: 1, description: '收到货款', accountCode: '1122', accountName: '应收账款', direction: 'debit', amount: 10000, balance: 10000 },
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', lineNo: 2, description: '收到货款', accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 10000, balance: 10000 },
      { voucherNo: 'JZ-0002', voucherDate: '2026-03-16', lineNo: 1, description: '采购原材料', accountCode: '1403', accountName: '原材料', direction: 'debit', amount: 5000, balance: 5000 },
      { voucherNo: 'JZ-0002', voucherDate: '2026-03-16', lineNo: 2, description: '采购原材料', accountCode: '2202', accountName: '应付账款', direction: 'credit', amount: 5000, balance: 5000 },
    ].filter(item => !accountCode || item.accountCode === accountCode);

    const start = (page - 1) * pageSize;
    return {
      data: mockData.slice(start, start + pageSize),
      total: mockData.length,
    };
  }

  // 总账查询
  async getGeneralLedger(tenantId: string, year: number, month: number): Promise<GeneralLedgerItem[]> {
    return [
      { accountCode: '1001', accountName: '银行存款', direction: 'debit', openingBalance: 50000, debitAmount: 10000, creditAmount: 8000, closingBalance: 52000 },
      { accountCode: '1002', accountName: '库存现金', direction: 'debit', openingBalance: 2000, debitAmount: 0, creditAmount: 1500, closingBalance: 500 },
      { accountCode: '1122', accountName: '应收账款', direction: 'debit', openingBalance: 30000, debitAmount: 10000, creditAmount: 20000, closingBalance: 20000 },
      { accountCode: '1403', accountName: '原材料', direction: 'debit', openingBalance: 10000, debitAmount: 5000, creditAmount: 3000, closingBalance: 12000 },
      { accountCode: '2202', accountName: '应付账款', direction: 'credit', openingBalance: 20000, debitAmount: 5000, creditAmount: 5000, closingBalance: 20000 },
      { accountCode: '5001', accountName: '主营业务收入', direction: 'credit', openingBalance: 0, debitAmount: 0, creditAmount: 30000, closingBalance: 30000 },
      { accountCode: '6001', accountName: '主营业务成本', direction: 'debit', openingBalance: 0, debitAmount: 18000, creditAmount: 0, closingBalance: 18000 },
    ];
  }

  // 日记账查询
  async getCashBook(
    tenantId: string,
    year: number,
    accountCode: string,
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
  ): Promise<{ data: CashBookItem[]; total: number }> {
    const cashAccounts = ['1001', '1002'];
    if (accountCode && !cashAccounts.includes(accountCode)) {
      return { data: [], total: 0 };
    }

    const mockData: CashBookItem[] = [
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', description: '收到货款', accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 10000, balance: 60000 },
      { voucherNo: 'JZ-0003', voucherDate: '2026-03-18', description: '支付工资', accountCode: '1001', accountName: '银行存款', direction: 'credit', amount: 15000, balance: 45000 },
      { voucherNo: 'JZ-0004', voucherDate: '2026-03-20', description: '提现', accountCode: '1002', accountName: '库存现金', direction: 'debit', amount: 5000, balance: 7000 },
      { voucherNo: 'JZ-0005', voucherDate: '2026-03-22', description: '购买办公用品', accountCode: '1002', accountName: '库存现金', direction: 'credit', amount: 500, balance: 6500 },
    ].filter(item => !accountCode || item.accountCode === accountCode);

    const start = (page - 1) * pageSize;
    return {
      data: mockData.slice(start, start + pageSize),
      total: mockData.length,
    };
  }

  // 科目余额表
  async getAccountBalance(tenantId: string, year: number, month: number): Promise<AccountBalanceItem[]> {
    return [
      { accountCode: '1', accountName: '资产', level: 1, direction: 'debit', openingBalance: 92000, debitAmount: 25000, creditAmount: 27500, closingBalance: 89500 },
      { accountCode: '1001', accountName: '银行存款', level: 3, direction: 'debit', openingBalance: 50000, debitAmount: 10000, creditAmount: 8000, closingBalance: 52000 },
      { accountCode: '1002', accountName: '库存现金', level: 3, direction: 'debit', openingBalance: 2000, debitAmount: 5000, creditAmount: 1500, closingBalance: 5500 },
      { accountCode: '1122', accountName: '应收账款', level: 3, direction: 'debit', openingBalance: 30000, debitAmount: 10000, creditAmount: 20000, closingBalance: 20000 },
      { accountCode: '1403', accountName: '原材料', level: 3, direction: 'debit', openingBalance: 10000, debitAmount: 5000, creditAmount: 3000, closingBalance: 12000 },
      { accountCode: '2', accountName: '负债', level: 1, direction: 'credit', openingBalance: 20000, debitAmount: 5000, creditAmount: 5000, closingBalance: 20000 },
      { accountCode: '2202', accountName: '应付账款', level: 3, direction: 'credit', openingBalance: 20000, debitAmount: 5000, creditAmount: 5000, closingBalance: 20000 },
      { accountCode: '4', accountName: '所有者权益', level: 1, direction: 'credit', openingBalance: 72000, debitAmount: 18000, creditAmount: 30000, closingBalance: 84000 },
      { accountCode: '4001', accountName: '实收资本', level: 3, direction: 'credit', openingBalance: 50000, debitAmount: 0, creditAmount: 0, closingBalance: 50000 },
      { accountCode: '4103', accountName: '本年利润', level: 3, direction: 'credit', openingBalance: 22000, debitAmount: 18000, creditAmount: 30000, closingBalance: 34000 },
      { accountCode: '5', accountName: '损益', level: 1, direction: 'credit', openingBalance: 0, debitAmount: 18000, creditAmount: 30000, closingBalance: 12000 },
      { accountCode: '5001', accountName: '主营业务收入', level: 3, direction: 'credit', openingBalance: 0, debitAmount: 0, creditAmount: 30000, closingBalance: 30000 },
      { accountCode: '6001', accountName: '主营业务成本', level: 3, direction: 'debit', openingBalance: 0, debitAmount: 18000, creditAmount: 0, closingBalance: 18000 },
    ];
  }

  // 多栏账查询
  async getMultiColumnBook(
    tenantId: string,
    year: number,
    accountCode: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    // 按明细科目多栏显示 - 常用与管理费用、销售费用等
    return {
      accountCode: accountCode || '6602',
      accountName: '管理费用',
      columns: [
        { code: '01', name: '办公费' },
        { code: '02', name: '差旅费' },
        { code: '03', name: '水电费' },
      ],
      items: [
        { date: '2026-03-05', voucherNo: 'JZ-0001', description: '购买办公用品', debit1: 1000, debit2: 0, debit3: 0 },
        { date: '2026-03-10', voucherNo: 'JZ-0002', description: '员工差旅报销', debit1: 0, debit2: 2000, debit3: 0 },
        { date: '2026-03-15', voucherNo: 'JZ-0003', description: '办公室水电费', debit1: 0, debit2: 0, debit3: 500 },
      ],
      totalDebit: 3500,
      totalCredit: 0,
      balance: 3500,
    };
  }
}