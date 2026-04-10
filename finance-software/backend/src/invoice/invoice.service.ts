import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Invoice, InvoiceType, InvoiceStatus } from './entities/invoice.entity';

export interface CreateInvoiceDto {
  invoiceNo: string;
  type: InvoiceType;
  amount: number;
  taxRate?: number;
  sellerName: string;
  sellerTaxNo?: string;
  buyerName?: string;
  buyerTaxNo?: string;
  date: string;
  attachment?: string;
  remark?: string;
}

export interface UpdateInvoiceDto {
  invoiceNo?: string;
  type?: InvoiceType;
  amount?: number;
  taxRate?: number;
  sellerName?: string;
  sellerTaxNo?: string;
  buyerName?: string;
  buyerTaxNo?: string;
  date?: string;
  status?: InvoiceStatus;
  attachment?: string;
  remark?: string;
}

export interface InvoiceQueryDto {
  type?: InvoiceType;
  status?: InvoiceStatus;
  sellerName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * 创建发票
   */
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    // 发票查重：同一发票号码 + 金额不能重复
    const existing = await this.invoiceRepository.findOne({
      where: { invoiceNo: dto.invoiceNo, amount: dto.amount },
    });
    if (existing) {
      throw new BadRequestException('该发票号码已存在，不能重复录入');
    }

    // 计算税额和不含税金额
    const taxRate = dto.taxRate || 0;
    const taxAmount = Number((dto.amount * taxRate / (1 + taxRate)).toFixed(2));
    const excludingTaxAmount = Number((dto.amount - taxAmount).toFixed(2));

    const invoice = this.invoiceRepository.create({
      ...dto,
      taxRate,
      taxAmount,
      excludingTaxAmount,
      status: InvoiceStatus.PENDING,
    });

    return this.invoiceRepository.save(invoice);
  }

  /**
   * 分页查询发票列表
   */
  async findAll(query: InvoiceQueryDto): Promise<{ data: Invoice[]; total: number }> {
    const { page = 1, pageSize = 20, type, status, sellerName, startDate, endDate } = query;

    const qb = this.invoiceRepository.createQueryBuilder('invoice');

    if (type) qb.andWhere('invoice.type = :type', { type });
    if (status) qb.andWhere('invoice.status = :status', { status });
    if (sellerName) qb.andWhere('invoice.sellerName LIKE :sellerName', { sellerName: `%${sellerName}%` });
    if (startDate) qb.andWhere('invoice.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('invoice.date <= :endDate', { endDate });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { data, total };
  }

  /**
   * 获取发票详情
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('发票不存在');
    }
    return invoice;
  }

  /**
   * 更新发票
   */
  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // 如果更新金额或发票号，需要重新查重
    if (dto.invoiceNo || dto.amount) {
      const invoiceNo = dto.invoiceNo || invoice.invoiceNo;
      const amount = dto.amount || invoice.amount;
      const existing = await this.invoiceRepository.findOne({
        where: { invoiceNo, amount },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('该发票号码已存在，不能重复录入');
      }
    }

    // 重新计算税额
    if (dto.amount || dto.taxRate) {
      const amount = dto.amount || invoice.amount;
      const taxRate = dto.taxRate ?? invoice.taxRate;
      (dto as any).taxAmount = Number((amount * taxRate / (1 + taxRate)).toFixed(2));
      (dto as any).excludingTaxAmount = Number((amount - ((dto as any).taxAmount as number)).toFixed(2));
    }

    Object.assign(invoice, dto);
    return this.invoiceRepository.save(invoice);
  }

  /**
   * 删除发票
   */
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    if (invoice.status === InvoiceStatus.USED) {
      throw new BadRequestException('已使用的发票不能删除');
    }
    await this.invoiceRepository.remove(invoice);
  }

  /**
   * 发票查重
   */
  async checkDuplicate(invoiceNo: string, amount: number): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { invoiceNo, amount },
    });
  }

  /**
   * 关联凭证（标记为已使用）
   */
  async bindVoucher(id: string, voucherId: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status === InvoiceStatus.USED) {
      throw new BadRequestException('发票已关联凭证');
    }
    invoice.status = InvoiceStatus.USED;
    invoice.voucherId = voucherId;
    return this.invoiceRepository.save(invoice);
  }

  /**
   * 统计报表数据
   */
  async getStatistics(startDate: string, endDate: string): Promise<any> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('invoice.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(invoice.amount)', 'totalAmount')
      .addSelect('SUM(invoice.taxAmount)', 'totalTax')
      .where('invoice.date >= :startDate', { startDate })
      .andWhere('invoice.date <= :endDate', { endDate })
      .groupBy('invoice.type')
      .getRawMany();

    return result;
  }
}