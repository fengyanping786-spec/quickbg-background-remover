import { Injectable } from '@nestjs/common';

@Injectable()
export class SummaryService {
  // 获取首页概览数据
  async getDashboardSummary(tenantId: string, year: number, month: number) {
    // Mock 数据 - 实际从数据库汇总
    return {
      // 凭证统计
      voucher: {
        totalCount: 28,
        draftCount: 3,
        approvedCount: 10,
        postedCount: 15,
        thisMonthCount: 12,
      },
      // 账户余额
      accounts: {
        bankBalance: 52000,
        cashBalance: 5500,
        totalBalance: 57500,
      },
      // 应收账款
      receivable: {
        total: 20000,
        overdue: 5000,
        count: 5,
      },
      // 应付账款
      payable: {
        total: 20000,
        dueSoon: 8000,
        count: 4,
      },
      // 本月收支
      monthly: {
        income: 105000,
        expense: 85000,
        profit: 20000,
      },
      // 发票统计
      invoice: {
        purchaseCount: 15,   // 进项发票
        purchaseAmount: 45000,
        salesCount: 8,       // 销项发票
        salesAmount: 80000,
      },
      // 税务概览
      tax: {
        vatDue: 9100,
        incomeTaxDue: 2000,
        taxRate: 2.0,
      },
    };
  }

  // 获取年度财务概览
  async getYearlySummary(tenantId: string, year: number) {
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      monthlyData.push({
        month,
        income: Math.floor(Math.random() * 50000) + 80000,
        expense: Math.floor(Math.random() * 40000) + 60000,
        profit: Math.floor(Math.random() * 20000) + 10000,
        voucherCount: Math.floor(Math.random() * 20) + 10,
      });
    }

    return {
      year,
      monthlyData,
      totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
      totalExpense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
      totalProfit: monthlyData.reduce((sum, m) => sum + m.profit, 0),
    };
  }

  // 获取快捷操作列表
  async getQuickActions() {
    return [
      { id: 'add-voucher', name: '新增凭证', icon: 'document', path: '/voucher', action: 'create' },
      { id: 'add-invoice', name: '录入发票', icon: 'ticket', path: '/invoice', action: 'create' },
      { id: 'view-report', name: '查看报表', icon: 'data-analysis', path: '/report', action: 'view' },
      { id: 'period-end', name: '期末处理', icon: 'setting', path: '/period-end', action: 'navigate' },
      { id: 'account-init', name: '科目初始化', icon: 'folder', path: '/account-init', action: 'navigate' },
      { id: 'backup', name: '数据备份', icon: 'download', path: '/backup', action: 'export' },
    ];
  }

  // 获取最近动态
  async getRecentActivities(tenantId: string, limit = 10) {
    return [
      { id: '1', type: 'voucher', action: '创建', title: '新增凭证 JZ-0028', time: '2026-03-28 10:30:00' },
      { id: '2', type: 'voucher', action: '审核', title: '审核凭证 JZ-0027', time: '2026-03-28 09:15:00' },
      { id: '3', type: 'invoice', action: '录入', title: '新增进项发票 FP001', time: '2026-03-27 16:20:00' },
      { id: '4', type: 'tax', action: '申报', title: '增值税申报完成', time: '2026-03-27 14:00:00' },
      { id: '5', type: 'period', action: '结账', title: '2月份结账完成', time: '2026-03-01 10:00:00' },
    ];
  }

  // 获取未处理事项
  async getPendingItems(tenantId: string) {
    return [
      { id: '1', type: 'voucher', title: '待审核凭证 (3张)', count: 3, priority: 'high' },
      { id: '2', type: 'invoice', title: '待验证发票 (2张)', count: 2, priority: 'medium' },
      { id: '3', type: 'tax', title: '本月税报未申报', count: 1, priority: 'high' },
      { id: '4', type: 'period', title: '期末结账未完成', count: 1, priority: 'medium' },
    ];
  }
}