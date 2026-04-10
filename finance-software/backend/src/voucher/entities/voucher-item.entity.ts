import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Voucher } from './voucher.entity';

@Entity('voucher_items')
export class VoucherItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  voucherId: string;  // 凭证ID

  @ManyToOne(() => Voucher, voucher => voucher.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;

  @Column({ nullable: true })
  tenantId: string;  // 所属账套

  @Column({ nullable: true })
  year: number;  // 会计年度

  @Column({ type: 'int', default: 1 })
  lineNo: number;  // 行号

  @Column({ length: 20 })
  accountCode: string;  // 科目编码

  @Column({ length: 100 })
  accountName: string;  // 科目名称

  @Column({ length: 10 })
  direction: 'debit' | 'credit';  // 借方/贷方

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;  // 金额

  @Column({ length: 200, nullable: true })
  description: string;  // 摘要

  @Column({ length: 200, nullable: true })
  auxInfo: string;  // 辅助核算信息

  @CreateDateColumn()
  createdAt: Date;
}