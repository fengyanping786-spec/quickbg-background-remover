import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class AccountPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ default: 'open' })
  status: 'open' | 'closed' | 'year_closed';

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}