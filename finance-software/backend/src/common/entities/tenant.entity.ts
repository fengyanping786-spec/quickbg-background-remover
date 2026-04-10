import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ unique: true })
  dbName: string;

  @Column({ nullable: true })
  taxNo: string;  // 税号

  @Column({ nullable: true })
  contact: string;  // 联系人

  @Column({ nullable: true })
  phone: string;  // 电话

  @Column({ nullable: true })
  address: string;  // 地址

  @Column({ default: 'active' })
  status: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}