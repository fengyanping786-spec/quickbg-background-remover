import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoucherWord } from './entities/voucher-word.entity';

@Injectable()
export class VoucherWordService {
  constructor(
    @InjectRepository(VoucherWord)
    private voucherWordRepository: Repository<VoucherWord>,
  ) {}

  async findAll(tenantId: string, year: number): Promise<VoucherWord[]> {
    return this.voucherWordRepository.find({
      where: { tenantId, year, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number): Promise<VoucherWord> {
    const word = await this.voucherWordRepository.findOne({ where: { id } });
    if (!word) {
      throw new NotFoundException(`凭证字 ID ${id} 不存在`);
    }
    return word;
  }

  async create(data: Partial<VoucherWord>): Promise<VoucherWord> {
    const word = this.voucherWordRepository.create(data);
    return this.voucherWordRepository.save(word);
  }

  async update(id: number, data: Partial<VoucherWord>): Promise<VoucherWord> {
    const word = await this.findById(id);
    Object.assign(word, data);
    return this.voucherWordRepository.save(word);
  }

  async delete(id: number): Promise<void> {
    const word = await this.findById(id);
    // 软删除
    word.isActive = false;
    await this.voucherWordRepository.save(word);
  }

  // 设置默认凭证字
  async setDefault(id: number, tenantId: string, year: number): Promise<void> {
    // 取消其他默认
    await this.voucherWordRepository.update(
      { tenantId, year, isDefault: true },
      { isDefault: false },
    );
    // 设置当前为默认
    await this.voucherWordRepository.update(id, { isDefault: true });
  }

  // 初始化默认凭证字
  async initDefault(tenantId: string, year: number): Promise<void> {
    const defaultWords = [
      { code: '记', name: '记账', displayOrder: 1, isDefault: true },
      { code: '收', name: '收款', displayOrder: 2, isDefault: false },
      { code: '付', name: '付款', displayOrder: 3, isDefault: false },
      { code: '转', name: '转账', displayOrder: 4, isDefault: false },
    ];

    for (const word of defaultWords) {
      const exists = await this.voucherWordRepository.findOne({
        where: { tenantId, year, code: word.code },
      });
      if (!exists) {
        await this.voucherWordRepository.save({
          ...word,
          tenantId,
          year,
        });
      }
    }
  }
}