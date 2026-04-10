import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { ExportService, ExportOptions } from './export.service';
import { ExcelExportService } from '../common/excel-export.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/reports')
@UseGuards(RolesGuard)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly exportService: ExportService,
    private readonly excelExportService: ExcelExportService,
  ) {}

  @Get('balance-sheet')
  @RequirePermissions(PermissionKeys.REPORT_READ)
  getBalanceSheet(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportService.getBalanceSheet(year, month, '');
  }

  @Get('profit-statement')
  @RequirePermissions(PermissionKeys.REPORT_READ)
  getProfitStatement(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportService.getProfitStatement(year, month, '');
  }

  @Get('cash-flow')
  @RequirePermissions(PermissionKeys.REPORT_READ)
  getCashFlow(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportService.getCashFlowStatement(year, month, '');
  }

  @Get('account-balance')
  @RequirePermissions(PermissionKeys.REPORT_READ)
  getAccountBalance() {
    return this.reportService.getAccountBalance('');
  }

  // ========== 导出功能 (返回 JSON 供前端下载) ==========

  @Get('balance-sheet/export')
  @RequirePermissions(PermissionKeys.REPORT_EXPORT)
  async exportBalanceSheet(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('format') format: 'excel' | 'csv' | 'pdf' = 'excel',
    @Res() res?: Response,
  ) {
    const data = await this.reportService.getBalanceSheet(year, month, '');
    const rows = this.exportService.generateBalanceSheet(data);

    if (format === 'csv') {
      const buffer = await this.exportService.exportToCsv(rows, { format: 'csv', fileName: '' });
      res?.setHeader('Content-Type', 'text/csv');
      res?.setHeader('Content-Disposition', `attachment; filename="资产负债表_${year}年${month}月.csv"`);
      return res?.send(buffer);
    }

    // Excel 格式
    const buffer = this.excelExportService.exportBalanceSheet(
      {
        assets: (data.assets || []).map(a => ({ name: a.name, begin: 0, end: a.balance })),
        liabilities: (data.liabilities || []).map(l => ({ name: l.name, begin: 0, end: l.balance })),
        equity: (data.equity || []).map(e => ({ name: e.name, begin: 0, end: e.balance })),
      },
      year,
      month
    );

    res?.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res?.setHeader('Content-Disposition', `attachment; filename="资产负债表_${year}年${month}月.xlsx"`);
    return res?.send(buffer);
  }

  @Get('profit-statement/export')
  @RequirePermissions(PermissionKeys.REPORT_EXPORT)
  async exportProfitStatement(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res?: Response,
  ) {
    const data = await this.reportService.getProfitStatement(year, month, '');

    if (format === 'csv') {
      const rows = this.exportService.generateIncomeStatement(data as any);
      const buffer = await this.exportService.exportToCsv(rows, { format: 'csv', fileName: '' });
      res?.setHeader('Content-Type', 'text/csv');
      res?.setHeader('Content-Disposition', `attachment; filename="利润表_${year}年${month}月.csv"`);
      return res?.send(buffer);
    }

    const buffer = this.excelExportService.exportProfitStatement(
      {
        revenue: (data.revenue || []).map(r => ({ name: r.name, current: r.amount, year: r.amount })),
        costs: (data.cost || []).map(c => ({ name: c.name, current: c.amount, year: c.amount })),
        expenses: (data.expenses || []).map(e => ({ name: e.name, current: e.amount, year: e.amount })),
      },
      year,
      month
    );

    res?.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res?.setHeader('Content-Disposition', `attachment; filename="利润表_${year}年${month}月.xlsx"`);
    return res?.send(buffer);
  }

  @Get('invoices/export')
  @RequirePermissions(PermissionKeys.REPORT_EXPORT)
  async exportInvoices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res?: Response,
  ) {
    // 获取发票数据
    const invoices = await this.reportService.getInvoiceData(startDate, endDate);
    const buffer = this.excelExportService.exportInvoices(invoices);

    res?.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res?.setHeader('Content-Disposition', `attachment; filename="发票明细_${startDate}_${endDate}.xlsx"`);
    return res?.send(buffer);
  }
}