import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VoucherItem } from './voucher-item.entity';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;  // 所属账套

  @Column({ nullable: true })
  year: number;  // 会计年度

  @Column({ unique: true, length: 50 })
  voucherNo: string;  // 凭证号（含凭证字，如：记-0001）

  @Column({ length: 10, nullable: true })
  voucherWord: string;  // 凭证字（如：记、收、付、转）

  @Column({ type: 'date' })
  voucherDate: Date;  // 凭证日期

  @Column({ length: 20, default: 'draft' })
  status: string;  // draft/approved/posted

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDebit: number;  // 借方合计

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCredit: number;  // 贷方合计

  @Column({ default: 0 })
  attachCount: number;  // 附件数量

  @Column({ type: 'text', nullable: true })
  attachment: string;  // 附件路径

  @Column({ length: 50, nullable: true })
  templateType: string;  // 模板类型

  @Column({ nullable: true })
  makerId: string;  // 制单人ID

  @Column({ length: 100, nullable: true })
  makerName: string;  // 制单人姓名

  @Column({ nullable: true })
  checkerId: string;  // 审核人ID

  @Column({ length: 100, nullable: true })
  checkerName: string;  // 审核人姓名

  @Column({ nullable: true })
  posterId: string;  // 过账人ID

  @Column({ length: 100, nullable: true })
  posterName: string;  // 过账人姓名

  @Column({ type: 'text', nullable: true })
  remark: string;  // 备注

  @OneToMany(() => VoucherItem, item => item.voucher)
  items: VoucherItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}