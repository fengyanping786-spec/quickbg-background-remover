import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodEndJob } from './entities/period-end-job.entity';

export interface TransferIncomeDto {
  tenantId: string;
  year: number;
  month: number;
  userId: string;
}

export interface TransferCostDto {
  tenantId: string;
  year: number;
  month: number;
  userId: string;
}

export interface TransferFeeDto {
  tenantId: string;
  year: number;
  month: number;
  userId: string;
}

export interface VoucherGenerateResult {
  success: boolean;
  voucherId?: string;
  voucherNo?: string;
  message: string;
}

@Injectable()
export class PeriodEndService {
  constructor(
    @InjectRepository(PeriodEndJob)
    private jobRepository: Repository<PeriodEndJob>,
  ) {}

  // 获取结转任务列表
  async getJobs(tenantId: string, year: number, month: number): Promise<PeriodEndJob[]> {
    return this.jobRepository.find({
      where: { tenantId: tenantId || undefined, year, month },
      order: { createdAt: 'ASC' },
    });
  }

  // 结转收入 (主营业务收入 -> 本年利润)
  async transferIncome(dto: TransferIncomeDto): Promise<VoucherGenerateResult> {
    // Mock: 假设本月收入合计 30000
    const incomeAmount = 30000;
    
    const job = this.jobRepository.create({
      tenantId: dto.tenantId,
      year: dto.year,
      month: dto.month,
      jobType: 'income_transfer',
      sourceAccountCode: '5001',
      targetAccountCode: '4103',
      amount: incomeAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `收入结转成功，结转金额 ¥${incomeAmount.toFixed(2)}`,
    };
  }

  // 结转成本 (主营业务成本 -> 本年利润)
  async transferCost(dto: TransferCostDto): Promise<VoucherGenerateResult> {
    // Mock: 假设本月成本合计 18000
    const costAmount = 18000;
    
    const job = this.jobRepository.create({
      tenantId: dto.tenantId,
      year: dto.year,
      month: dto.month,
      jobType: 'cost_transfer',
      sourceAccountCode: '6001',
      targetAccountCode: '4103',
      amount: costAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `成本结转成功，结转金额 ¥${costAmount.toFixed(2)}`,
    };
  }

  // 结转费用 (费用科目 -> 本年利润)
  async transferFee(dto: TransferFeeDto): Promise<VoucherGenerateResult> {
    // Mock: 假设本月费用合计 5000
    const feeAmount = 5000;
    
    const job = this.jobRepository.create({
      tenantId: dto.tenantId,
      year: dto.year,
      month: dto.month,
      jobType: 'fee_transfer',
      sourceAccountCode: '6602',
      targetAccountCode: '4103',
      amount: feeAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `费用结转成功，结转金额 ¥${feeAmount.toFixed(2)}`,
    };
  }

  // 计提折旧
  async calculateDepreciation(tenantId: string, year: number, month: number, userId: string): Promise<VoucherGenerateResult> {
    // Mock: 折旧金额 2000
    const depreciationAmount = 2000;
    
    const job = this.jobRepository.create({
      tenantId,
      year,
      month,
      jobType: 'depreciation',
      sourceAccountCode: '1601',
      targetAccountCode: '1602',
      amount: depreciationAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `计提折旧成功，折旧金额 ¥${depreciationAmount.toFixed(2)}`,
    };
  }

  // 结转增值税
  async transferVat(tenantId: string, year: number, month: number, userId: string): Promise<VoucherGenerateResult> {
    // Mock: 增值税 3000
    const vatAmount = 3000;
    
    const job = this.jobRepository.create({
      tenantId,
      year,
      month,
      jobType: 'vat_transfer',
      sourceAccountCode: '2221',
      targetAccountCode: '2221',
      amount: vatAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `增值税结转成功，金额 ¥${vatAmount.toFixed(2)}`,
    };
  }

  // 计提工资
  async calculateSalary(tenantId: string, year: number, month: number, userId: string): Promise<VoucherGenerateResult> {
    // Mock: 工资总额 15000（实际应从工资模块获取）
    const salaryAmount = 15000;
    // 社保公积金约 15%
    const socialAmount = salaryAmount * 0.15;
    // 个税约 3%
    const taxAmount = salaryAmount * 0.03;
    
    const job = this.jobRepository.create({
      tenantId,
      year,
      month,
      jobType: 'salary',
      sourceAccountCode: '6602',  // 管理费用-工资
      targetAccountCode: '2203',  // 应付职工薪酬
      amount: salaryAmount,
      status: 'success',
      executedAt: new Date(),
    });
    await this.jobRepository.save(job);

    return {
      success: true,
      voucherNo: `JZ-${String(Date.now()).slice(-6)}`,
      message: `计提工资成功，工资 ¥${salaryAmount.toFixed(2)}，社保 ¥${socialAmount.toFixed(2)}，个税 ¥${taxAmount.toFixed(2)}`,
    };
  }

  // 执行全部结转
  async executeAllTransfers(dto: TransferIncomeDto): Promise<{ success: number; failed: number; results: VoucherGenerateResult[] }> {
    const results: VoucherGenerateResult[] = [];
    let success = 0, failed = 0;

    try {
      const r1 = await this.transferIncome(dto);
      results.push(r1);
      success++;
    } catch (e) {
      results.push({ success: false, message: e.message });
      failed++;
    }

    try {
      const r2 = await this.transferCost(dto);
      results.push(r2);
      success++;
    } catch (e) {
      results.push({ success: false, message: e.message });
      failed++;
    }

    try {
      const r3 = await this.transferFee(dto);
      results.push(r3);
      success++;
    } catch (e) {
      results.push({ success: false, message: e.message });
      failed++;
    }

    return { success, failed, results };
  }

  // 获取结转类型选项
  getTransferTypes(): { type: string; label: string; description: string }[] {
    return [
      { type: 'income_transfer', label: '结转收入', description: '将主营业务收入结转至本年利润' },
      { type: 'cost_transfer', label: '结转成本', description: '将主营业务成本结转至本年利润' },
      { type: 'fee_transfer', label: '结转费用', description: '将期间费用结转至本年利润' },
      { type: 'depreciation', label: '计提折旧', description: '计提固定资产折旧' },
      { type: 'vat_transfer', label: '结转增值税', description: '结转应交增值税' },
      { type: 'salary', label: '计提工资', description: '计提本月工资及社保' },
    ];
  }
}