import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('voucher_templates')
export class VoucherTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string;  // 模板编码

  @Column({ length: 100 })
  name: string;  // 模板名称

  @Column({ length: 20 })
  category: string;  // 模板分类：trip/salary/purchase/sales/other

  @Column({ type: 'text' })
  description: string;  // 模板说明

  @Column({ type: 'simple-json' })
  items: {
    accountCode: string;   // 科目编码
    accountName: string;   // 科目名称
    direction: 'debit' | 'credit';  // 借方/贷方
    defaultAmount?: number;  // 默认金额
    description?: string;  // 摘要
  }[];  // 凭证分录

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 默认凭证模板
export const DEFAULT_TEMPLATES = [
  {
    code: 'TRIP',
    name: '差旅费报销',
    category: 'trip',
    description: '员工出差报销差旅费用',
    items: [
      { accountCode: '6602', accountName: '差旅费', direction: 'debit' as const },
      { accountCode: '1002', accountName: '库存现金', direction: 'credit' as const },
    ],
  },
  {
    code: 'SALARY',
    name: '工资发放',
    category: 'salary',
    description: '员工工资发放',
    items: [
      { accountCode: '6601', accountName: '工资', direction: 'debit' as const },
      { accountCode: '1002', accountName: '库存现金', direction: 'credit' as const },
    ],
  },
  {
    code: 'PURCHASE',
    name: '采购入库',
    category: 'purchase',
    description: '采购原材料入库',
    items: [
      { accountCode: '1403', accountName: '原材料', direction: 'debit' as const },
      { accountCode: '2202', accountName: '应付账款', direction: 'credit' as const },
    ],
  },
  {
    code: 'SALES',
    name: '销售收款',
    category: 'sales',
    description: '销售商品收到货款',
    items: [
      { accountCode: '1001', accountName: '银行存款', direction: 'debit' as const },
      { accountCode: '5001', accountName: '主营业务收入', direction: 'credit' as const },
    ],
  },
  {
    code: 'EXPENSE',
    name: '日常费用',
    category: 'other',
    description: '办公费等日常费用',
    items: [
      { accountCode: '6603', accountName: '办公费', direction: 'debit' as const },
      { accountCode: '1002', accountName: '库存现金', direction: 'credit' as const },
    ],
  },
];