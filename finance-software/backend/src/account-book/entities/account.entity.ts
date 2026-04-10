import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  year: number;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: 1 })
  level: number;

  @Column({ nullable: true })
  parentCode: string;

  @Column({ default: 'debit' })
  direction: 'debit' | 'credit';

  @Column({ default: false })
  isAuxiliary: boolean;

  @Column({ nullable: true })
  auxType: string;

  @Column({ default: false })
  isCash: boolean;

  @Column({ default: false })
  isQuantity: boolean;

  @Column({ nullable: true })
  unit: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  openingBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 辅助核算类型
@Entity('aux_types')
export class AuxType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 辅助核算项目
@Entity('aux_items')
export class AuxItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ length: 50 })
  auxTypeCode: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 期初余额
@Entity('opening_balances')
export class OpeningBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  year: number;

  @Column({ length: 20 })
  accountCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  debitBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditBalance: number;

  @Column({ nullable: true })
  auxType: string;

  @Column({ nullable: true })
  auxItemCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}