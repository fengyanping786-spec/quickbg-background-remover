import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InvoiceType {
  VAT_SPECIAL = 'VAT_SPECIAL',  // 增值税专用发票
  VAT_NORMAL = 'VAT_NORMAL',    // 增值税普通发票
  RECEIPT = 'RECEIPT',          // 收据
}

export enum InvoiceStatus {
  PENDING = 'pending',    // 待处理
  USED = 'used',         // 已使用
  VERIFIED = 'verified', // 已验证
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  invoiceNo: string;  // 发票号码

  @Column({ type: 'varchar', length: 20 })
  type: InvoiceType;  // 发票类型

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;  // 含税金额

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;  // 税率

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;  // 税额

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  excludingTaxAmount: number;  // 不含税金额

  @Column({ type: 'varchar', length: 200 })
  sellerName: string;  // 销售方名称

  @Column({ type: 'varchar', length: 50, nullable: true })
  sellerTaxNo: string;  // 销售方税号

  @Column({ type: 'varchar', length: 200, nullable: true })
  buyerName: string;  // 购买方名称

  @Column({ type: 'varchar', length: 50, nullable: true })
  buyerTaxNo: string;  // 购买方税号

  @Column({ type: 'date' })
  date: string;  // 开票日期

  @Column({ type: 'varchar', length: 50 })
  status: InvoiceStatus;  // 状态

  @Column({ type: 'varchar', length: 500, nullable: true })
  attachment: string;  // 附件路径

  @Column({ type: 'varchar', length: 50, nullable: true })
  voucherId: string;  // 关联的凭证ID

  @Column({ type: 'varchar', length: 50, nullable: true })
  remark: string;  // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}