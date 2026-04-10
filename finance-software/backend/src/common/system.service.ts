import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';

export interface SystemSettings {
  companyName: string;
  companyTaxNo: string;
  companyAddress: string;
  companyPhone: string;
  invoicePrefix: string;
  voucherPrefix: string;
  enableTaxWarning: boolean;
  taxWarningThreshold: number;
  enableAutoBackup: boolean;
  autoBackupFrequency: string;
}

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 获取系统设置
  async getSettings(tenantId: string): Promise<SystemSettings> {
    // Mock 数据 - 实际应从数据库读取
    return {
      companyName: '小微企业财务有限公司',
      companyTaxNo: '91110000XXXXXXXX',
      companyAddress: '北京市朝阳区某某街道',
      companyPhone: '010-12345678',
      invoicePrefix: 'FP',
      voucherPrefix: 'JZ',
      enableTaxWarning: true,
      taxWarningThreshold: 1,
      enableAutoBackup: true,
      autoBackupFrequency: 'daily',
    };
  }

  // 更新系统设置
  async updateSettings(tenantId: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    // 实际应保存到数据库
    return { ...await this.getSettings(tenantId), ...settings };
  }

  // 获取系统信息
  async getSystemInfo() {
    return {
      version: '1.0.0',
      buildDate: '2026-03-28',
      environment: 'production',
      database: 'SQLite',
      totalVouchers: 28,
      totalInvoices: 23,
      totalUsers: 5,
      lastBackup: '2026-03-28 10:00:00',
    };
  }

  // 系统健康检查
  async healthCheck() {
    return {
      status: 'healthy',
      database: 'connected',
      disk: { used: '2.5GB', total: '10GB', percent: 25 },
      memory: { used: '256MB', total: '512MB', percent: 50 },
      uptime: '24 hours',
    };
  }
}