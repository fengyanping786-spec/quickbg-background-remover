import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  header?: string[];
}

@Injectable()
export class ExcelExportService {
  /**
   * 导出数据为 Excel 文件
   */
  export(data: any[], options: ExcelExportOptions): Buffer {
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    const colWidths = this.calculateColumnWidth(data, options.header);
    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

    // 写入缓冲区
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  /**
   * 导出并保存到文件
   */
  exportToFile(data: any[], options: ExcelExportOptions & { filePath: string }): string {
    const buffer = this.export(data, options);
    const dir = path.dirname(options.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.filePath, buffer);
    return options.filePath;
  }

  /**
   * 导出资产负债表
   */
  exportBalanceSheet(data: {
    assets: { name: string; begin: number; end: number }[];
    liabilities: { name: string; begin: number; end: number }[];
    equity: { name: string; begin: number; end: number }[];
  }, year: number, month: number): Buffer {
    const rows: any[] = [];

    // 标题
    rows.push({ A: '', B: '', C: '' });
    rows.push({ A: `资产负债表（${year}年${month}月）`, B: '', C: '' });
    rows.push({ A: '', B: '', C: '' });

    // 资产
    rows.push({ A: '资产', B: '年初余额', C: '期末余额' });
    data.assets.forEach(item => {
      rows.push({ A: item.name, B: item.begin, C: item.end });
    });
    const totalAssets = data.assets.reduce((s, i) => s + i.end, 0);
    rows.push({ A: '资产总计', B: '', C: totalAssets });
    rows.push({ A: '', B: '', C: '' });

    // 负债
    rows.push({ A: '负债', B: '年初余额', C: '期末余额' });
    data.liabilities.forEach(item => {
      rows.push({ A: item.name, B: item.begin, C: item.end });
    });
    const totalLiabilities = data.liabilities.reduce((s, i) => s + i.end, 0);
    rows.push({ A: '负债合计', B: '', C: totalLiabilities });
    rows.push({ A: '', B: '', C: '' });

    // 所有者权益
    rows.push({ A: '所有者权益', B: '年初余额', C: '期末余额' });
    data.equity.forEach(item => {
      rows.push({ A: item.name, B: item.begin, C: item.end });
    });
    const totalEquity = data.equity.reduce((s, i) => s + i.end, 0);
    rows.push({ A: '所有者权益合计', B: '', C: totalEquity });
    rows.push({ A: '', B: '', C: '' });

    // 总计
    rows.push({ A: '负债和所有者权益总计', B: '', C: totalLiabilities + totalEquity });

    // 格式化数字
    rows.forEach(row => {
      if (row.B && typeof row.B === 'number') row.B = this.formatNumber(row.B);
      if (row.C && typeof row.C === 'number') row.C = this.formatNumber(row.C);
    });

    return this.export(rows, {
      fileName: `资产负债表_${year}年${month}月`,
      sheetName: '资产负债表',
    });
  }

  /**
   * 导出利润表
   */
  exportProfitStatement(data: {
    revenue: { name: string; current: number; year: number }[];
    costs: { name: string; current: number; year: number }[];
    expenses: { name: string; current: number; year: number }[];
  }, year: number, month: number): Buffer {
    const rows: any[] = [];

    // 标题
    rows.push({ A: '', B: '', C: '' });
    rows.push({ A: `利润表（${year}年${month}月）`, B: '', C: '' });
    rows.push({ A: '', B: '', C: '' });

    // 收入
    rows.push({ A: '项目', B: '本期金额', C: '本年累计' });
    data.revenue.forEach(item => {
      rows.push({ A: item.name, B: item.current, C: item.year });
    });
    const totalRevenue = data.revenue.reduce((s, i) => s + i.current, 0);
    rows.push({ A: '营业收入合计', B: totalRevenue, C: data.revenue.reduce((s, i) => s + i.year, 0) });
    rows.push({ A: '', B: '', C: '' });

    // 成本
    data.costs.forEach(item => {
      rows.push({ A: item.name, B: item.current, C: item.year });
    });
    const totalCosts = data.costs.reduce((s, i) => s + i.current, 0);
    rows.push({ A: '营业成本合计', B: totalCosts, C: data.costs.reduce((s, i) => s + i.year, 0) });
    
    // 毛利
    const grossProfit = totalRevenue - totalCosts;
    rows.push({ A: '毛利润', B: grossProfit, C: data.revenue.reduce((s, i) => s + i.year, 0) - data.costs.reduce((s, i) => s + i.year, 0) });
    rows.push({ A: '', B: '', C: '' });

    // 费用
    data.expenses.forEach(item => {
      rows.push({ A: item.name, B: item.current, C: item.year });
    });
    const totalExpenses = data.expenses.reduce((s, i) => s + i.current, 0);
    rows.push({ A: '费用合计', B: totalExpenses, C: data.expenses.reduce((s, i) => s + i.year, 0) });

    // 净利润
    const netProfit = grossProfit - totalExpenses;
    rows.push({ A: '', B: '', C: '' });
    rows.push({ A: '净利润', B: netProfit, C: (data.revenue.reduce((s, i) => s + i.year, 0) - data.costs.reduce((s, i) => s + i.year, 0) - data.expenses.reduce((s, i) => s + i.year, 0)) });

    // 格式化
    rows.forEach(row => {
      if (row.B && typeof row.B === 'number') row.B = this.formatNumber(row.B);
      if (row.C && typeof row.C === 'number') row.C = this.formatNumber(row.C);
    });

    return this.export(rows, {
      fileName: `利润表_${year}年${month}月`,
      sheetName: '利润表',
    });
  }

  /**
   * 导出发票明细
   */
  exportInvoices(data: any[]): Buffer {
    const rows = data.map(inv => ({
      '发票号码': inv.invoiceNo,
      '类型': inv.type === 'VAT_SPECIAL' ? '专用发票' : inv.type === 'VAT_NORMAL' ? '普通发票' : '收据',
      '销售方': inv.sellerName,
      '购买方': inv.buyerName,
      '金额': inv.amount,
      '税额': inv.taxAmount || 0,
      '税率': inv.taxRate + '%',
      '开票日期': inv.date,
      '状态': inv.status === 'pending' ? '待处理' : inv.status === 'used' ? '已使用' : '已验证',
    }));

    return this.export(rows, {
      fileName: `发票明细_${new Date().toISOString().split('T')[0]}`,
      sheetName: '发票明细',
    });
  }

  /**
   * 导出发票统计表
   */
  exportInvoiceStatistics(data: {
    type: string;
    count: number;
    amount: number;
    taxAmount: number;
  }[]): Buffer {
    const rows = data.map(stat => ({
      '发票类型': stat.type,
      '数量': stat.count,
      '金额': stat.amount,
      '税额': stat.taxAmount,
      '平均金额': stat.count > 0 ? (stat.amount / stat.count).toFixed(2) : 0,
    }));

    // 合计行
    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const totalTax = data.reduce((s, i) => s + i.taxAmount, 0);
    const totalCount = data.reduce((s, i) => s + i.count, 0);
    rows.push({
      '发票类型': '合计',
      '数量': totalCount,
      '金额': totalAmount,
      '税额': totalTax,
      '平均金额': (totalAmount / totalCount).toFixed(2),
    });

    return this.export(rows, {
      fileName: `发票统计_${new Date().toISOString().split('T')[0]}`,
      sheetName: '发票统计',
    });
  }

  // ========== 私有方法 ==========

  private calculateColumnWidth(data: any[], headers?: string[]): number[] {
    if (!data || data.length === 0) return [20];
    
    const keys = headers || Object.keys(data[0]);
    return keys.map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.slice(0, 100).map(row => String(row[key] || '').length)
      );
      return Math.min(Math.max(maxLen + 2, 10), 50);
    });
  }

  private formatNumber(num: number): string {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}