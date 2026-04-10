import { Controller, Get, Post, Put, Delete, Param, Query, ParseIntPipe, Body } from '@nestjs/common';
import { AccountBookService } from './account-book.service';

@Controller('v1/account-books')
export class AccountBookController {
  constructor(private readonly accountBookService: AccountBookService) {}

  // ========== 科目管理 API ==========

  // 初始化科目
  @Post('accounts/init')
  async initAccounts(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    const count = await this.accountBookService.initDefaultAccounts(tenantId, year);
    return { success: true, message: `已初始化 ${count} 个会计科目` };
  }

  // 获取科目树
  @Get('accounts/tree')
  async getAccountTree(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.accountBookService.getAccountTree(tenantId, year);
  }

  // 获取科目列表
  @Get('accounts')
  async getAccounts(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.accountBookService.getAccounts(tenantId, year);
  }

  // 创建科目
  @Post('accounts')
  async createAccount(@Body() data: any) {
    return this.accountBookService.createAccount(data);
  }

  // 更新科目
  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() data: any) {
    return this.accountBookService.updateAccount(id, data);
  }

  // 删除科目
  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    await this.accountBookService.deleteAccount(id);
    return { success: true, message: '科目已删除' };
  }

  // ========== 期初余额 API ==========

  // 设置期初余额
  @Post('opening-balances')
  async setOpeningBalance(@Body() data: {
    tenantId?: string;
    year: number;
    accountCode: string;
    debitBalance?: number;
    creditBalance?: number;
    auxType?: string;
    auxItemCode?: string;
  }) {
    return this.accountBookService.setOpeningBalance(data);
  }

  // 获取期初余额列表
  @Get('opening-balances')
  async getOpeningBalances(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.accountBookService.getOpeningBalances(tenantId, year);
  }

  // 删除期初余额
  @Delete('opening-balances/:id')
  async deleteOpeningBalance(@Param('id') id: string) {
    await this.accountBookService.deleteOpeningBalance(id);
    return { success: true, message: '期初余额已删除' };
  }

  // ========== 辅助核算 API ==========

  // 获取辅助核算类型
  @Get('aux-types')
  async getAuxTypes(@Query('tenantId') tenantId: string) {
    return this.accountBookService.getAuxTypes(tenantId);
  }

  // 创建辅助核算类型
  @Post('aux-types')
  async createAuxType(@Body() data: any) {
    return this.accountBookService.createAuxType(data);
  }

  // 获取辅助核算项目
  @Get('aux-items')
  async getAuxItems(
    @Query('tenantId') tenantId: string,
    @Query('auxTypeCode') auxTypeCode: string,
  ) {
    return this.accountBookService.getAuxItems(tenantId, auxTypeCode);
  }

  // 创建辅助核算项目
  @Post('aux-items')
  async createAuxItem(@Body() data: any) {
    return this.accountBookService.createAuxItem(data);
  }

  // ========== 账簿查询 API ==========

  // 明细账查询
  @Get('detail')
  async getDetailBook(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('accountCode') accountCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 50,
  ) {
    return this.accountBookService.getDetailBook(tenantId, year, accountCode, startDate, endDate, page, pageSize);
  }

  // 总账查询
  @Get('general')
  async getGeneralLedger(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.accountBookService.getGeneralLedger(tenantId, year, month);
  }

  // 日记账查询
  @Get('cash')
  async getCashBook(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('accountCode') accountCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 50,
  ) {
    return this.accountBookService.getCashBook(tenantId, year, accountCode, startDate, endDate, page, pageSize);
  }

  // 科目余额表
  @Get('balance')
  async getAccountBalance(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.accountBookService.getAccountBalance(tenantId, year, month);
  }

  // 多栏账查询
  @Get('multi-column')
  async getMultiColumnBook(
    @Query('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('accountCode') accountCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountBookService.getMultiColumnBook(tenantId, year, accountCode, startDate, endDate);
  }
}