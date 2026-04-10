import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { PeriodEndService, TransferIncomeDto } from './period-end.service';

@Controller('v1/period-end')
export class PeriodEndController {
  constructor(private readonly periodEndService: PeriodEndService) {}

  // 获取结转任务列表
  @Get('jobs')
  async getJobs(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.periodEndService.getJobs(tenantId, year, month);
  }

  // 获取结转类型
  @Get('types')
  getTransferTypes() {
    return this.periodEndService.getTransferTypes();
  }

  // 结转收入
  @Post('transfer-income')
  async transferIncome(@Body() dto: TransferIncomeDto) {
    return this.periodEndService.transferIncome(dto);
  }

  // 结转成本
  @Post('transfer-cost')
  async transferCost(@Body() dto: TransferIncomeDto) {
    return this.periodEndService.transferCost(dto);
  }

  // 结转费用
  @Post('transfer-fee')
  async transferFee(@Body() dto: TransferIncomeDto) {
    return this.periodEndService.transferFee(dto);
  }

  // 计提折旧
  @Post('depreciation')
  async depreciation(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('userId') userId: string,
  ) {
    return this.periodEndService.calculateDepreciation(tenantId, year, month, userId);
  }

  // 结转增值税
  @Post('vat-transfer')
  async vatTransfer(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('userId') userId: string,
  ) {
    return this.periodEndService.transferVat(tenantId, year, month, userId);
  }

  // 计提工资
  @Post('salary')
  async calculateSalary(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('userId') userId: string,
  ) {
    return this.periodEndService.calculateSalary(tenantId, year, month, userId);
  }

  // 执行全部结转
  @Post('transfer-all')
  async transferAll(@Body() dto: TransferIncomeDto) {
    return this.periodEndService.executeAllTransfers(dto);
  }
}