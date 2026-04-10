import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;  // 用户名（登录用）

  @Column({ length: 100 })
  password: string;  // 加密后的密码

  @Column({ length: 50 })
  realName: string;  // 真实姓名

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ default: false })
  isSuperAdmin: boolean;  // 是否超级管理员

  @Column({ nullable: true })
  tenantId: string;  // 所属账套（普通用户）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}