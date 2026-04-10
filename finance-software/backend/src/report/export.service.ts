import { Injectable } from '@nestjs/common';

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  fileName: string;
  sheetName?: string;
}

@Injectable()
export class ExportService {
  /**
   * 导出为 Excel (使用 xlsx 库)
   * 实际项目需安装: npm install xlsx
   */
  async exportToExcel(data: any[], options: ExportOptions): Promise<Buffer> {
    // 实际实现:
    // import * as XLSX from 'xlsx';
    // const worksheet = XLSX.utils.json_to_sheet(data);
    // const workbook = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
    // return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

    // 模拟返回
    return Buffer.from('Excel mock data');
  }

  /**
   * 导出为 CSV
   */
  async exportToCsv(data: any[], options: ExportOptions): Promise<Buffer> {
    if (!data || data.length === 0) return Buffer.from('');

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(h => {
        const val = row[h];
        // 处理包含逗号的值
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val ?? '';
      });
      csvRows.push(values.join(','));
    }

    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }

  /**
   * 导出为 PDF (使用 pdfkit)
   * 实际项目需安装: npm install pdfkit
   */
  async exportToPdf(data: any[], options: ExportOptions): Promise<Buffer> {
    // 实际实现:
    // const doc = new PDFDocument();
    // doc.fontSize(16).text(options.fileName, { align: 'center' });
    // // 添加表格内容
    // return doc.end();

    return Buffer.from('PDF mock data');
  }

  /**
   * 生成资产负债表
   */
  generateBalanceSheet(data: {
    assets: { name: string; amount?: number; balance?: number }[];
    liabilities: { name: string; amount?: number; balance?: number }[];
    equity: { name: string; amount?: number; balance?: number }[];
  }): any[] {
    const rows: any[] = [];

    // 资产
    rows.push({ 项目: '资产', 金额: '' });
    data.assets.forEach(a => {
      rows.push({ 项目: `  ${a.name}`, 金额: a.amount || a.balance || 0 });
    });
    const totalAssets = data.assets.reduce((s, a) => s + (a.amount || a.balance || 0), 0);
    rows.push({ 项目: '资产合计', 金额: totalAssets });

    // 负债
    rows.push({ 项目: '负债', 金额: '' });
    data.liabilities.forEach(l => {
      rows.push({ 项目: `  ${l.name}`, 金额: l.amount });
    });
    const totalLiabilities = data.liabilities.reduce((s, l) => s + (l.amount || l.balance || 0), 0);
    rows.push({ 项目: '负债合计', 金额: totalLiabilities });

    // 所有者权益
    rows.push({ 项目: '所有者权益', 金额: '' });
    data.equity.forEach(e => {
      rows.push({ 项目: `  ${e.name}`, 金额: e.amount || e.balance || 0 });
    });
    const totalEquity = data.equity.reduce((s, e) => s + (e.amount || e.balance || 0), 0);
    rows.push({ 项目: '所有者权益合计', 金额: totalEquity });

    rows.push({ 项目: '负债和权益总计', 金额: totalLiabilities + totalEquity });

    return rows;
  }

  /**
   * 生成利润表
   */
  generateIncomeStatement(data: {
    revenue: { name: string; amount: number }[];
    costs: { name: string; amount: number }[];
    expenses: { name: string; amount: number }[];
  }): any[] {
    const rows: any[] = [];

    // 收入
    rows.push({ 项目: '营业收入', 金额: '' });
    data.revenue.forEach(r => {
      rows.push({ 项目: `  ${r.name}`, 金额: r.amount });
    });
    const totalRevenue = data.revenue.reduce((s, r) => s + r.amount, 0);
    rows.push({ 项目: '营业收入合计', 金额: totalRevenue });

    // 成本
    rows.push({ 项目: '营业成本', 金额: '' });
    data.costs.forEach(c => {
      rows.push({ 项目: `  ${c.name}`, 金额: c.amount });
    });
    const totalCosts = data.costs.reduce((s, c) => s + c.amount, 0);

    // 毛利
    const grossProfit = totalRevenue - totalCosts;
    rows.push({ 项目: '毛利润', 金额: grossProfit });

    // 费用
    rows.push({ 项目: '费用', 金额: '' });
    data.expenses.forEach(e => {
      rows.push({ 项目: `  ${e.name}`, 金额: e.amount });
    });
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);

    // 净利润
    const netProfit = grossProfit - totalExpenses;
    rows.push({ 项目: '净利润', 金额: netProfit });

    return rows;
  }
}