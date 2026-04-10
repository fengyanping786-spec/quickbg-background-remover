import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherItem } from './entities/voucher-item.entity';
import { VoucherTemplate, DEFAULT_TEMPLATES } from './entities/voucher-template.entity';

export interface CreateVoucherDto {
  tenantId?: string;
  year?: number;
  voucherDate: string;
  remark?: string;
  attachment?: string;
  templateType?: string;
  voucherWord?: string;
  voucherNo?: string;
  items: {
    accountCode: string;
    accountName: string;
    direction: 'debit' | 'credit';
    amount: number;
    description?: string;
    auxType?: string;
    auxItemCode?: string;
  }[];
}

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(VoucherItem)
    private itemRepository: Repository<VoucherItem>,
    @InjectRepository(VoucherTemplate)
    private templateRepository: Repository<VoucherTemplate>,
  ) {}

  // 生成凭证编号 - 支持凭证字格式
  private async generateVoucherNo(voucherWord?: string): Promise<string> {
    const word = voucherWord || '记';
    
    // 查询当前最大的凭证号
    const lastVoucher = await this.voucherRepository
      .createQueryBuilder('v')
      .where('v.voucherNo LIKE :pattern', { pattern: `${word}-%` })
      .orderBy('v.voucherNo', 'DESC')
      .getOne();
    
    let nextNum = 1;
    if (lastVoucher) {
      const match = lastVoucher.voucherNo.match(/-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    return `${word}-${String(nextNum).padStart(4, '0')}`;
  }

  async create(data: any): Promise<Voucher> {
    if (!data.items || data.items.length < 2) {
      throw new BadRequestException('凭证至少需要两条分录');
    }

    const debitTotal = data.items.filter(i => i.direction === 'debit').reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
    const creditTotal = data.items.filter(i => i.direction === 'credit').reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
    if (debitTotal !== creditTotal) {
      throw new BadRequestException('借方合计与贷方合计不相等');
    }

    // 生成凭证号
    const voucherNo = data.voucherNo || await this.generateVoucherNo(data.voucherWord);

    const voucher = this.voucherRepository.create({
      tenantId: data.tenantId || null,
      year: data.year || null,
      voucherNo,
      voucherWord: data.voucherWord || '记',
      voucherDate: new Date(data.voucherDate),
      status: 'draft',
      totalDebit: debitTotal,
      totalCredit: creditTotal,
      remark: data.remark,
    });
    const savedVoucher = await this.voucherRepository.save(voucher);

    let lineNo = 1;
    for (const item of data.items) {
      const voucherItem = this.itemRepository.create({
        voucherId: savedVoucher.id,
        tenantId: data.tenantId || null,
        year: data.year || null,
        lineNo: lineNo++,
        accountCode: item.accountCode,
        accountName: item.accountName,
        direction: item.direction,
        amount: item.amount,
        description: item.description,
        auxInfo: item.auxItemCode ? `${item.auxType}:${item.auxItemCode}` : null,
      });
      await this.itemRepository.save(voucherItem);
    }

    return savedVoucher;
  }

  async findAll(page = 1, pageSize = 20, search?: string, status?: string): Promise<{ data: Voucher[]; total: number }> {
    const query = this.voucherRepository.createQueryBuilder('v');
    
    if (search) {
      query.where('v.voucherNo LIKE :search OR v.remark LIKE :search', { search: `%${search}%` });
    }
    if (status) {
      query.andWhere('v.status = :status', { status });
    }
    
    const total = await query.getCount();
    const data = await query
      .orderBy('v.voucherDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    
    return { data, total };
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException('凭证不存在');
    }
    return voucher;
  }

  async findOneWithItems(id: string): Promise<any> {
    const voucher = await this.findOne(id);
    const items = await this.itemRepository.find({ where: { voucherId: id } });
    return { ...voucher, items };
  }

  async update(id: string, data: any): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'draft') {
      throw new BadRequestException('只能修改草稿状态的凭证');
    }
    
    Object.assign(voucher, {
      voucherDate: data.voucherDate ? new Date(data.voucherDate) : voucher.voucherDate,
      remark: data.remark ?? voucher.remark,
      totalDebit: data.totalDebit ?? voucher.totalDebit,
      totalCredit: data.totalCredit ?? voucher.totalCredit,
    });
    
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的凭证');
    }
    await this.itemRepository.delete({ voucherId: id });
    await this.voucherRepository.remove(voucher);
  }

  async approve(id: string, userId: string, userName: string): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'draft') {
      throw new BadRequestException('只能审核草稿状态的凭证');
    }
    voucher.status = 'approved';
    voucher.checkerId = userId;
    voucher.checkerName = userName;
    return this.voucherRepository.save(voucher);
  }

  async unapprove(id: string): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'approved') {
      throw new BadRequestException('只能反审核已审核的凭证');
    }
    voucher.status = 'draft';
    voucher.checkerId = null;
    voucher.checkerName = null;
    return this.voucherRepository.save(voucher);
  }

  async post(id: string, userId: string): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'approved') {
      throw new BadRequestException('只能过账已审核的凭证');
    }
    voucher.status = 'posted';
    voucher.posterId = userId;
    return this.voucherRepository.save(voucher);
  }

  async unpost(id: string): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.status !== 'posted') {
      throw new BadRequestException('只能反过账已过账的凭证');
    }
    voucher.status = 'approved';
    voucher.posterId = null;
    voucher.posterName = null;
    return this.voucherRepository.save(voucher);
  }

  async batchApprove(ids: string[], userId: string, userName: string): Promise<{ success: number; failed: number }> {
    let success = 0, failed = 0;
    for (const id of ids) {
      try {
        await this.approve(id, userId, userName);
        success++;
      } catch { failed++; }
    }
    return { success, failed };
  }

  async batchDelete(ids: string[]): Promise<{ success: number; failed: number }> {
    let success = 0, failed = 0;
    for (const id of ids) {
      try {
        await this.remove(id);
        success++;
      } catch { failed++; }
    }
    return { success, failed };
  }

  // 模板相关
  async getTemplates() {
    const templates = await this.templateRepository.find();
    if (templates.length === 0) {
      await this.initDefaultTemplates();
      return this.templateRepository.find();
    }
    return templates;
  }

  async initDefaultTemplates() {
    for (const tpl of DEFAULT_TEMPLATES) {
      const exists = await this.templateRepository.findOne({ where: { name: tpl.name } });
      if (!exists) {
        await this.templateRepository.save(this.templateRepository.create(tpl));
      }
    }
  }

  async createTemplate(data: any) {
    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async updateTemplate(id: string, data: any) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('模板不存在');
    Object.assign(template, data);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('模板不存在');
    await this.templateRepository.remove(template);
  }

  async createFromTemplate(templateId: string, amount: number, remark?: string) {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('模板不存在');
    
    const items = template.items.map((item: any, index: number) => ({
      accountCode: item.accountCode,
      accountName: item.accountName,
      direction: index === 0 ? 'debit' : 'credit',
      amount: index === 0 ? amount : amount,
      description: remark || template.name,
    }));
    
    return this.create({
      voucherDate: new Date().toISOString().split('T')[0],
      remark: remark || template.description,
      templateType: template.category,
      items,
    });
  }

  // 凭证号管理
  async getVoucherNumbers() {
    const vouchers = await this.voucherRepository.find({
      order: { voucherNo: 'ASC' },
      select: ['voucherNo'],
    });
    return vouchers.map(v => v.voucherNo);
  }

  async detectBrokenNumbers() {
    const vouchers = await this.voucherRepository.find({
      order: { voucherNo: 'ASC' },
      select: ['voucherNo'],
    });
    const numbers = vouchers.map(v => {
      const match = v.voucherNo.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
    
    const broken: number[] = [];
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    for (let i = min; i <= max; i++) {
      if (!numbers.includes(i)) broken.push(i);
    }
    return broken;
  }

  async reorganizeNumbers() {
    const vouchers = await this.voucherRepository.find({
      order: { createdAt: 'ASC' },
    });
    let counter = 1;
    for (const v of vouchers) {
      const newNo = `JZ-${String(counter++).padStart(4, '0')}`;
      if (v.voucherNo !== newNo) {
        v.voucherNo = newNo;
        await this.voucherRepository.save(v);
      }
    }
    return { success: true, message: `已重新整理 ${vouchers.length} 个凭证号` };
  }
}