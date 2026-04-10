import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('voucher_words')
export class VoucherWord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: string;  // 账套ID

  @Column()
  year: number;  // 年度

  @Column()
  code: string;  // 凭证字编码（如：记、收、付、转）

  @Column()
  name: string;  // 凭证字名称

  @Column({ default: 1 })
  displayOrder: number;  // 显示顺序

  @Column({ default: true })
  isDefault: boolean;  // 是否默认

  @Column({ default: true })
  isActive: boolean;  // 是否启用

  @CreateDateColumn()
  createdAt: Date;
}