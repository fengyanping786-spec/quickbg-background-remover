import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class PeriodEndJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column()
  jobType: string; // 'income_transfer', 'cost_transfer', 'fee_transfer', 'depreciation', 'vat_transfer'

  @Column({ nullable: true })
  sourceAccountCode: string;

  @Column({ nullable: true })
  targetAccountCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  amount: number;

  @Column({ nullable: true })
  generatedVoucherId: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'success' | 'failed';

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  executedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}