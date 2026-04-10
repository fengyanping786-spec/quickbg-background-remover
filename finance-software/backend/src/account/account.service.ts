import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';

export interface CreateAccountDto {
  code: string;
  name: string;
  type: 'bank' | 'cash' | 'wechat' | 'alipay';
  bankName?: string;
  accountNo?: string;
  currency?: string;
  tenantId?: string;
  year?: number;
}

export interface UpdateAccountDto {
  name?: string;
  type?: 'bank' | 'cash' | 'wechat' | 'alipay';
  bankName?: string;
  accountNo?: string;
  isActive?: boolean;
}

export interface TransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  remark?: string;
}

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(BankAccount)
    private accountRepository: Repository<BankAccount>,
  ) {}

  /**
   * 创建账户
   */
  async create(dto: CreateAccountDto, tenantId?: string, year?: number): Promise<BankAccount> {
    // 检查编码是否重复（同一账套下）
    const existing = await this.accountRepository.findOne({ 
      where: { code: dto.code, tenantId: tenantId || null, year: year || null } 
    });
    if (existing) {
      throw new BadRequestException('账户编码已存在');
    }

    const account = this.accountRepository.create({
      ...dto,
      balance: 0,
      currency: dto.currency || 'CNY',
      isActive: true,
      tenantId: tenantId || null,
      year: year || null,
    });

    return this.accountRepository.save(account);
  }

  /**
   * 获取账户列表
   */
  async findAll(page = 1, pageSize = 10, tenantId?: string, year?: number): Promise<{ data: BankAccount[]; total: number }> {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (year) where.year = year;
    
    const [data, total] = await this.accountRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    });

    return { data, total };
  }

  /**
   * 获取账户详情
   */
  async findOne(id: string): Promise<BankAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('账户不存在');
    }
    return account;
  }

  /**
   * 更新账户
   */
  async update(id: string, dto: UpdateAccountDto): Promise<BankAccount> {
    const account = await this.findOne(id);
    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  /**
   * 删除账户
   */
  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    
    // 检查余额是否为0
    if (account.balance !== 0) {
      throw new BadRequestException('账户余额不为0，无法删除');
    }

    await this.accountRepository.remove(account);
  }

  /**
   * 账户间转账
   */
  async transfer(dto: TransferDto): Promise<void> {
    const { fromAccountId, toAccountId, amount } = dto;

    if (fromAccountId === toAccountId) {
      throw new BadRequestException('转出账户和转入账户不能相同');
    }

    if (amount <= 0) {
      throw new BadRequestException('转账金额必须大于0');
    }

    // 获取转出账户
    const fromAccount = await this.findOne(fromAccountId);
    if (fromAccount.balance < amount) {
      throw new BadRequestException('余额不足');
    }

    // 获取转入账户
    const toAccount = await this.findOne(toAccountId);

    // 执行转账（原子操作）
    await this.accountRepository.manager.transaction(async (manager) => {
      // 减少转出账户余额
      await manager.update(BankAccount, fromAccountId, {
        balance: fromAccount.balance - amount,
      });

      // 增加转入账户余额
      await manager.update(BankAccount, toAccountId, {
        balance: toAccount.balance + amount,
      });
    });
  }

  /**
   * 更新余额（收款/付款时调用）
   */
  async updateBalance(id: string, amount: number, type: 'add' | 'subtract'): Promise<BankAccount> {
    const account = await this.findOne(id);

    if (type === 'subtract' && account.balance < amount) {
      throw new BadRequestException('余额不足');
    }

    const newBalance = type === 'add' 
      ? account.balance + amount 
      : account.balance - amount;

    await this.accountRepository.update(id, { balance: newBalance });
    return this.findOne(id);
  }

  /**
   * 获取所有账户汇总余额
   */
  async getTotalBalance(): Promise<number> {
    const result = await this.accountRepository
      .createQueryBuilder('account')
      .select('SUM(account.balance)', 'total')
      .where('account.isActive = :isActive', { isActive: true })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}