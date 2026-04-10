import { Controller, Get, Query } from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('v1/summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  // 获取首页概览数据
  @Get('dashboard')
  getDashboardSummary(
    @Query('tenantId') tenantId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.summaryService.getDashboardSummary(tenantId, year, month);
  }

  // 获取年度财务概览
  @Get('yearly')
  getYearlySummary(
    @Query('tenantId') tenantId: string,
    @Query('year') year: number,
  ) {
    return this.summaryService.getYearlySummary(tenantId, year);
  }

  // 获取快捷操作
  @Get('quick-actions')
  getQuickActions() {
    return this.summaryService.getQuickActions();
  }

  // 获取最近动态
  @Get('recent-activities')
  getRecentActivities(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit: number,
  ) {
    return this.summaryService.getRecentActivities(tenantId, limit);
  }

  // 获取未处理事项
  @Get('pending-items')
  getPendingItems(@Query('tenantId') tenantId: string) {
    return this.summaryService.getPendingItems(tenantId);
  }
}