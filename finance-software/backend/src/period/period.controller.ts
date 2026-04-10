import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { PeriodService } from './period.service';

@Controller('v1/periods')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  // 获取期间列表
  @Get()
  async getPeriods(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.periodService.getPeriods(tenantId, year);
  }

  // 获取当前期间
  @Get('current')
  async getCurrentPeriod(
    @Query('tenantId') tenantId: string,
  ) {
    return this.periodService.getCurrentPeriod(tenantId);
  }

  // 结账
  @Post(':year/:month/close')
  async closePeriod(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body('userId') userId: string,
    @Body('remark') remark?: string,
  ) {
    return this.periodService.closePeriod(year, month, userId, remark);
  }

  // 反结账
  @Post(':year/:month/unclose')
  async unclosePeriod(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body('userId') userId: string,
  ) {
    return this.periodService.unclosePeriod(year, month, userId);
  }

  // 年末结账
  @Post(':year/close-year')
  async closeYear(
    @Param('year', ParseIntPipe) year: number,
    @Body('userId') userId: string,
  ) {
    return this.periodService.closeYear(year, userId);
  }
}