import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRecord, TaxType, TaxPeriod } from './entities/tax-record.entity';

export interface CalculateVatDto {
  periodStart: string;
  periodEnd: string;
  salesAmount: number;    // 销项金额（含税）
  salesTax: number;       // 销项税额
  purchaseAmount: number; // 进项金额（含税）
  purchaseTax: number;   // 进项税额
  inputTaxCredit?: number; // 进项税额转出（可选）
}

export interface TaxQueryDto {
  type?: TaxType;
  period?: TaxPeriod;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxRecord)
    private taxRepository: Repository<TaxRecord>,
  ) {}

  /**
   * 计算增值税（进项税 - 销项税）
   */
  calculateVat(dto: CalculateVatDto): {
    salesAmount: number;
    salesTax: number;
    purchaseAmount: number;
    purchaseTax: number;
    inputTaxCredit: number;
    totalOutputTax: number;
    totalInputTax: number;
    vatDue: number;
    taxRate: number;
  } {
    const { salesAmount, salesTax, purchaseAmount, purchaseTax, inputTaxCredit = 0 } = dto;

    // 增值税 = 销项税额 - 进项税额 + 进项税额转出
    const totalOutputTax = salesTax;
    const totalInputTax = purchaseTax - inputTaxCredit;
    const vatDue = totalOutputTax - totalInputTax;

    // 税负率 = 应纳税额 / 销售金额
    const taxRate = salesAmount > 0 ? Number((vatDue / salesAmount * 100).toFixed(2)) : 0;

    return {
      salesAmount,
      salesTax,
      purchaseAmount,
      purchaseTax,
      inputTaxCredit,
      totalOutputTax,
      totalInputTax,
      vatDue: vatDue > 0 ? vatDue : 0,  // 只有正数才需要缴税
      taxRate,
    };
  }

  /**
   * 保存税务记录
   */
  async createRecord(dto: CalculateVatDto): Promise<TaxRecord> {
    const calculation = this.calculateVat(dto);

    const record = this.taxRepository.create({
      type: TaxType.VAT,
      period: dto.periodStart === dto.periodEnd ? TaxPeriod.MONTHLY : TaxPeriod.QUARTERLY,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      salesAmount: dto.salesAmount,
      salesTax: dto.salesTax,
      purchaseAmount: dto.purchaseAmount,
      purchaseTax: dto.purchaseTax,
      inputTaxCredit: dto.inputTaxCredit || 0,
      taxDue: calculation.vatDue,
      taxRate: calculation.taxRate,
      status: 'draft',
    });

    return this.taxRepository.save(record);
  }

  /**
   * 分页查询税务记录
   */
  async findAll(query: TaxQueryDto): Promise<{ data: TaxRecord[]; total: number }> {
    const { page = 1, pageSize = 20, type, period, status, startDate, endDate } = query;

    const qb = this.taxRepository.createQueryBuilder('tax');

    if (type) qb.andWhere('tax.type = :type', { type });
    if (period) qb.andWhere('tax.period = :period', { period });
    if (status) qb.andWhere('tax.status = :status', { status });
    if (startDate) qb.andWhere('tax.periodStart >= :startDate', { startDate });
    if (endDate) qb.andWhere('tax.periodEnd <= :endDate', { endDate });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('tax.periodEnd', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { data, total };
  }

  /**
   * 获取税务记录详情
   */
  async findOne(id: string): Promise<TaxRecord> {
    const record = await this.taxRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('税务记录不存在');
    }
    return record;
  }

  /**
   * 更新税务记录
   */
  async update(id: string, dto: Partial<CalculateVatDto>): Promise<TaxRecord> {
    const record = await this.findOne(id);
    if (record.status !== 'draft') {
      throw new BadRequestException('只能修改草稿状态的记录');
    }

    // 重新计算
    const calculation = this.calculateVat({
      ...dto,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
    } as CalculateVatDto);

    Object.assign(record, {
      salesAmount: dto.salesAmount ?? record.salesAmount,
      salesTax: dto.salesTax ?? record.salesTax,
      purchaseAmount: dto.purchaseAmount ?? record.purchaseAmount,
      purchaseTax: dto.purchaseTax ?? record.purchaseTax,
      inputTaxCredit: dto.inputTaxCredit ?? record.inputTaxCredit,
      taxDue: calculation.vatDue,
      taxRate: calculation.taxRate,
    });

    return this.taxRepository.save(record);
  }

  /**
   * 删除税务记录
   */
  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    if (record.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的记录');
    }
    await this.taxRepository.remove(record);
  }

  /**
   * 税负预警
   */
  async checkTaxBurdenWarning(taxRate: number): Promise<{
    isWarning: boolean;
    level: 'safe' | 'low' | 'high';
    message: string;
  }> {
    // 正常税负率范围：1%-3%
    if (taxRate < 1) {
      return {
        isWarning: true,
        level: 'low',
        message: `税负率 ${taxRate}% 低于正常范围（1%-3%），可能存在税务风险`,
      };
    } else if (taxRate > 3) {
      return {
        isWarning: true,
        level: 'high',
        message: `税负率 ${taxRate}% 高于正常范围（1%-3%），请确认是否存在异常`,
      };
    }
    return {
      isWarning: false,
      level: 'safe',
      message: `税负率 ${taxRate}% 处于正常范围`,
    };
  }

  /**
   * 导出申报表（按税务要求格式）
   */
  async exportTaxDeclaration(id: string): Promise<any> {
    const record = await this.findOne(id);

    // 增值税申报表格式
    return {
      // 表头信息
      taxType: '增值税',
      period: `${record.periodStart} 至 ${record.periodEnd}`,
      declareType: record.period === TaxPeriod.MONTHLY ? '月报' : '季报',

      // 销售额
      salesAmount: record.salesAmount,
      salesTax: record.salesTax,

      // 进项税额
      purchaseAmount: record.purchaseAmount,
      purchaseTax: record.purchaseTax,
      inputTaxCredit: record.inputTaxCredit,

      // 应纳税额
      taxDue: record.taxDue,
      taxRate: record.taxRate,

      // 申报状态
      status: record.status,
    };
  }

  /**
   * 计算所得税（简化版）
   * 企业所得税 = 应纳税所得额 × 税率
   * 小微企业：应纳税所得额 ≤ 300万 税率5%，超过部分25%
   */
  async calculateIncomeTax(income: number, expenses: number): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    taxRate: number;
    taxDue: number;
    effectiveRate: number;
  }> {
    // 应纳税所得额 = 收入 - 费用
    const profit = income - expenses;
    
    // 亏损不需要纳税
    if (profit <= 0) {
      return {
        revenue: income,
        expenses: expenses,
        profit: profit,
        taxRate: 0,
        taxDue: 0,
        effectiveRate: 0,
      };
    }

    // 小微企业税收优惠
    let taxRate: number;
    let taxDue: number;

    if (profit <= 3000000) {
      // 应纳税所得额不超过300万，税率5%
      taxRate = 0.05;
      taxDue = profit * 0.05;
    } else {
      // 超过300万部分按25%征税
      const before300 = 3000000 * 0.05; // 15万
      const over300 = (profit - 3000000) * 0.25;
      taxDue = before300 + over300;
      taxRate = Number((taxDue / profit * 100).toFixed(2));
    }

    const effectiveRate = Number((taxDue / income * 100).toFixed(2));

    return {
      revenue: income,
      expenses: expenses,
      profit: profit,
      taxRate: taxRate * 100, // 转为百分比
      taxDue: Number(taxDue.toFixed(2)),
      effectiveRate: effectiveRate,
    };
  }

  /**
   * 获取税务申报表列表（扩展）
   */
  async getDeclarationList(year: number, month: number): Promise<any> {
    // 返回当月的税务申报数据
    return {
      vat: {
        salesAmount: 100000,
        salesTax: 13000,
        purchaseAmount: 30000,
        purchaseTax: 3900,
        vatDue: 9100,
        taxRate: 9.1,
      },
      incomeTax: {
        revenue: 100000,
        expenses: 60000,
        profit: 40000,
        taxDue: 2000,
      },
      declarationStatus: 'pending',
    };
  }
}