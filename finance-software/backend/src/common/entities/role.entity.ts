import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;  // 角色编码

  @Column({ length: 50 })
  name: string;  // 角色名称

  @Column({ type: 'text', nullable: true })
  description: string;  // 描述

  @Column({ type: 'simple-json', default: '[]' })
  permissions: string[];  // 权限列表

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 默认角色
export const DEFAULT_ROLES = [
  {
    code: 'admin',
    name: '管理员',
    description: '拥有全部权限，可管理系统配置和用户',
    permissions: [
      'account:read', 'account:write', 'account:delete',
      'voucher:read', 'voucher:write', 'voucher:approve', 'voucher:delete',
      'invoice:read', 'invoice:write', 'invoice:delete',
      'report:read', 'report:export',
      'tax:read', 'tax:write',
      'user:read', 'user:write', 'user:delete',
      'tenant:read', 'tenant:write',
      'settings:read', 'settings:write',
    ],
  },
  {
    code: 'accountant',
    name: '记账员',
    description: '负责凭证录入、发票管理',
    permissions: [
      'account:read',
      'voucher:read', 'voucher:write',
      'invoice:read', 'invoice:write',
      'report:read',
    ],
  },
  {
    code: 'viewer',
    name: '查看员',
    description: '只读财务报表',
    permissions: [
      'account:read',
      'voucher:read',
      'invoice:read',
      'report:read',
    ],
  },
];