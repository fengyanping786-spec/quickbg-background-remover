import { Injectable } from '@nestjs/common';

@Injectable()
export class DataService {
  // 导出科目初始数据
  async exportAccounts(tenantId: string, year: number) {
    return {
      accounts: [
        { code: '1001', name: '银行存款', level: 3, direction: 'debit', openingBalance: 50000 },
        { code: '1002', name: '库存现金', level: 3, direction: 'debit', openingBalance: 2000 },
        { code: '1122', name: '应收账款', level: 3, direction: 'debit', openingBalance: 30000 },
        { code: '2202', name: '应付账款', level: 3, direction: 'credit', openingBalance: 20000 },
        { code: '4001', name: '实收资本', level: 3, direction: 'credit', openingBalance: 50000 },
      ],
      exportTime: new Date().toISOString(),
      year,
    };
  }

  // 导入科目初始数据
  async importAccounts(tenantId: string, data: any[]) {
    let success = 0, failed = 0;
    for (const item of data) {
      try {
        // 实际保存到数据库
        success++;
      } catch (e) {
        failed++;
      }
    }
    return { success, failed, total: data.length };
  }

  // 导出凭证数据
  async exportVouchers(tenantId: string, year: number, startMonth?: number, endMonth?: number) {
    return {
      vouchers: [
        { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', totalDebit: 10000, totalCredit: 10000, status: 'posted' },
        { voucherNo: 'JZ-0002', voucherDate: '2026-03-16', totalDebit: 5000, totalCredit: 5000, status: 'approved' },
      ],
      exportTime: new Date().toISOString(),
      year,
    };
  }

  // 导入凭证数据
  async importVouchers(tenantId: string, data: any[]) {
    let success = 0, failed = 0;
    for (const item of data) {
      try {
        // 实际保存到数据库
        success++;
      } catch (e) {
        failed++;
      }
    }
    return { success, failed, total: data.length };
  }

  // 获取操作日志
  async getOperationLogs(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    pageSize = 20,
  ) {
    const mockLogs = [
      { id: '1', user: 'admin', action: '登录', module: '系统', ip: '127.0.0.1', time: '2026-03-28 10:00:00' },
      { id: '2', user: 'admin', action: '创建凭证', module: '凭证', detail: 'JZ-0006', ip: '127.0.0.1', time: '2026-03-28 10:30:00' },
      { id: '3', user: 'admin', action: '审核凭证', module: '凭证', detail: 'JZ-0005', ip: '127.0.0.1', time: '2026-03-28 11:00:00' },
      { id: '4', user: 'admin', action: '过账凭证', module: '凭证', detail: 'JZ-0004', ip: '127.0.0.1', time: '2026-03-28 11:30:00' },
      { id: '5', user: 'admin', action: '录入发票', module: '发票', detail: 'FP001', ip: '127.0.0.1', time: '2026-03-28 14:00:00' },
    ];

    const start = (page - 1) * pageSize;
    return {
      data: mockLogs.slice(start, start + pageSize),
      total: mockLogs.length,
      page,
      pageSize,
    };
  }

  // 清空操作日志
  async clearLogs(tenantId: string, beforeDate: string) {
    // 实际应删除数据库记录
    return { success: true, message: `已清空 ${beforeDate} 之前的日志` };
  }
}