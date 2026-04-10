import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string;  // 账户编码

  @Column({ length: 100 })
  name: string;  // 账户名称

  @Column({ length: 20 })
  type: 'bank' | 'cash' | 'wechat' | 'alipay';  // 账户类型

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;  // 当前余额

  @Column({ length: 10, default: 'CNY' })
  currency: string;  // 币种

  @Column({ length: 200, nullable: true })
  bankName: string;  // 开户银行

  @Column({ length: 50, nullable: true })
  accountNo: string;  // 账号

  @Column({ default: true })
  isActive: boolean;  // 是否启用

  @Column({ nullable: true })
  tenantId: string;  // 所属账套

  @Column({ nullable: true })
  year: number;  // 会计年度

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}