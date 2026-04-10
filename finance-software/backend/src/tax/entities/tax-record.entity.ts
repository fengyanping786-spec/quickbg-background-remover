import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TaxType {
  VAT = 'VAT',           // 增值税
  INCOME_TAX = 'INCOME_TAX', // 企业所得税
  SURTAX = 'SURTAX',    // 附加税
}

export enum TaxPeriod {
  MONTHLY = 'monthly',  // 月报
  QUARTERLY = 'quarterly', // 季报
  YEARLY = 'yearly',    // 年报
}

@Entity()
export class TaxRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  type: TaxType;  // 税种

  @Column({ type: 'varchar', length: 20 })
  period: TaxPeriod;  // 申报周期

  @Column({ type: 'date' })
  periodStart: string;  // 所属期开始

  @Column({ type: 'date' })
  periodEnd: string;  // 所属期结束

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  salesAmount: number;  // 销项金额

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  salesTax: number;  // 销项税额

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  purchaseAmount: number;  // 进项金额

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  purchaseTax: number;  // 进项税额

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  inputTaxCredit: number;  // 进项税额转出

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxDue: number;  // 应纳税额

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;  // 税负率

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;  // draft / submitted / paid

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string;  // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}