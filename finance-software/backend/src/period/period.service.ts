import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountPeriod } from './entities/period.entity';

@Injectable()
export class PeriodService {
  constructor(
    @InjectRepository(AccountPeriod)
    private periodRepository: Repository<AccountPeriod>,
  ) {}

  // 获取期间列表
  async getPeriods(tenantId: string, year: number): Promise<AccountPeriod[]> {
    return this.periodRepository.find({
      where: { tenantId: tenantId || undefined, year: year || undefined },
      order: { year: 'DESC', month: 'ASC' },
    });
  }

  // 获取当前期间
  async getCurrentPeriod(tenantId: string): Promise<AccountPeriod | null> {
    const period = await this.periodRepository.findOne({
      where: { tenantId: tenantId || undefined, status: 'open' },
      order: { year: 'DESC', month: 'DESC' },
    });
    // 如果没有open的期间，返回最近的一个
    if (!period) {
      return this.periodRepository.findOne({
        where: { tenantId: tenantId || undefined },
        order: { year: 'DESC', month: 'DESC' },
      });
    }
    return period;
  }

  // 初始化年度期间 (1-12月)
  async initYearPeriods(tenantId: string, year: number): Promise<AccountPeriod[]> {
    const periods: AccountPeriod[] = [];
    for (let month = 1; month <= 12; month++) {
      const period = this.periodRepository.create({
        tenantId,
        year,
        month,
        status: 'open',
      });
      const saved = await this.periodRepository.save(period);
      periods.push(saved);
    }
    return periods;
  }

  // 结账
  async closePeriod(year: number, month: number, userId: string, remark?: string): Promise<AccountPeriod> {
    // 检查是否有未审核/未过账的凭证
    // TODO: 检查凭证状态
    
    // 检查上月是否已结账
    if (month > 1) {
      const prevPeriod = await this.periodRepository.findOne({
        where: { year, month: month - 1, status: 'closed' },
      });
      if (!prevPeriod) {
        throw new BadRequestException(`${year}年${month - 1}月尚未结账，无法结${month}月`);
      }
    }

    const period = await this.periodRepository.findOne({
      where: { year, month },
    });
    if (!period) {
      throw new BadRequestException('期间不存在');
    }
    if (period.status !== 'open') {
      throw new BadRequestException(`${year}年${month}月不是开放状态，无法结账`);
    }

    period.status = 'closed';
    period.closedAt = new Date();
    period.closedBy = userId;
    period.remark = remark;

    return this.periodRepository.save(period);
  }

  // 反结账
  async unclosePeriod(year: number, month: number, userId: string): Promise<AccountPeriod> {
    const period = await this.periodRepository.findOne({
      where: { year, month },
    });
    if (!period) {
      throw new BadRequestException('期间不存在');
    }
    if (period.status !== 'closed') {
      throw new BadRequestException(`${year}年${month}月不是已结账状态，无法反结账`);
    }

    // 检查下月是否已结账
    if (month < 12) {
      const nextPeriod = await this.periodRepository.findOne({
        where: { year, month: month + 1, status: 'closed' },
      });
      if (nextPeriod) {
        throw new BadRequestException(`${year}年${month + 1}月已结账，请先反结账下月`);
      }
    }

    period.status = 'open';
    period.closedAt = null;
    period.closedBy = null;
    period.remark = null;

    return this.periodRepository.save(period);
  }

  // 年末结账
  async closeYear(year: number, userId: string): Promise<{ success: boolean; message: string }> {
    // 检查12月是否已结账
    const december = await this.periodRepository.findOne({
      where: { year, month: 12, status: 'closed' },
    });
    if (!december) {
      throw new BadRequestException('12月尚未结账，无法进行年末结账');
    }

    // 将12月标记为 year_closed
    december.status = 'year_closed';
    await this.periodRepository.save(december);

    // 创建新年度期间
    await this.initYearPeriods(undefined, year + 1);

    return { success: true, message: `${year}年度结账完成，已自动创建${year + 1}年度期间` };
  }
}