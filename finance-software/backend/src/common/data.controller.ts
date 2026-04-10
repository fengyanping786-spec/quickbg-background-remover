import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('v1/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  // 导出科目初始数据
  @Get('export/accounts')
  async exportAccounts(
    @Query('tenantId') tenantId: string,
    @Query('year') year: number,
  ) {
    return this.dataService.exportAccounts(tenantId, year);
  }

  // 导入科目初始数据
  @Post('import/accounts')
  async importAccounts(
    @Query('tenantId') tenantId: string,
    @Body() data: any[],
  ) {
    return this.dataService.importAccounts(tenantId, data);
  }

  // 导出凭证数据
  @Get('export/vouchers')
  async exportVouchers(
    @Query('tenantId') tenantId: string,
    @Query('year') year: number,
    @Query('startMonth') startMonth?: number,
    @Query('endMonth') endMonth?: number,
  ) {
    return this.dataService.exportVouchers(tenantId, year, startMonth, endMonth);
  }

  // 导入凭证数据
  @Post('import/vouchers')
  async importVouchers(
    @Query('tenantId') tenantId: string,
    @Body() data: any[],
  ) {
    return this.dataService.importVouchers(tenantId, data);
  }

  // 获取操作日志
  @Get('logs')
  async getOperationLogs(
    @Query('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.dataService.getOperationLogs(tenantId, startDate, endDate, page, pageSize);
  }

  // 清空操作日志
  @Post('logs/clear')
  async clearLogs(
    @Query('tenantId') tenantId: string,
    @Body() body: { beforeDate: string },
  ) {
    return this.dataService.clearLogs(tenantId, body.beforeDate);
  }
}