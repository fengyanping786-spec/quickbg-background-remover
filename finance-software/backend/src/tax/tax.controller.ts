import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TaxService, CalculateVatDto, TaxQueryDto } from './tax.service';
import { TaxRecord } from './entities/tax-record.entity';

@Controller('v1/tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  /**
   * POST /tax/vat/calculate - 计算增值税
   */
  @Post('vat/calculate')
  calculateVat(@Body() dto: CalculateVatDto): ReturnType<TaxService['calculateVat']> {
    return this.taxService.calculateVat(dto);
  }

  /**
   * POST /tax/records - 创建税务记录
   */
  @Post('records')
  async createRecord(@Body() dto: CalculateVatDto): Promise<TaxRecord> {
    return this.taxService.createRecord(dto);
  }

  /**
   * GET /tax/records - 分页查询税务记录
   */
  @Get('records')
  async findAll(@Query() query: TaxQueryDto): Promise<{ data: TaxRecord[]; total: number }> {
    return this.taxService.findAll(query);
  }

  /**
   * GET /tax/records/:id - 获取税务记录详情
   */
  @Get('records/:id')
  async findOne(@Param('id') id: string): Promise<TaxRecord> {
    return this.taxService.findOne(id);
  }

  /**
   * PUT /tax/records/:id - 更新税务记录
   */
  @Put('records/:id')
  async update(@Param('id') id: string, @Body() dto: Partial<CalculateVatDto>): Promise<TaxRecord> {
    return this.taxService.update(id, dto);
  }

  /**
   * DELETE /tax/records/:id - 删除税务记录
   */
  @Delete('records/:id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.taxService.remove(id);
    return { message: '删除成功' };
  }

  /**
   * POST /tax/warning - 税负预警检查
   */
  @Post('warning')
  checkTaxBurdenWarning(
    @Body() body: { taxRate: number },
  ): ReturnType<TaxService['checkTaxBurdenWarning']> {
    return this.taxService.checkTaxBurdenWarning(body.taxRate);
  }

  /**
   * GET /tax/records/:id/export - 导出申报表
   */
  @Get('records/:id/export')
  async exportTaxDeclaration(@Param('id') id: string): Promise<any> {
    return this.taxService.exportTaxDeclaration(id);
  }

  /**
   * POST /tax/income-tax/calculate - 计算所得税
   */
  @Post('income-tax/calculate')
  calculateIncomeTax(
    @Body() body: { income: number; expenses: number },
  ) {
    return this.taxService.calculateIncomeTax(body.income, body.expenses);
  }

  /**
   * GET /tax/declaration/:year/:month - 获取税务申报表
   */
  @Get('declaration/:year/:month')
  getDeclarationList(
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.taxService.getDeclarationList(year, month);
  }

  /**
   * GET /tax/declaration/:year/:month/export - 导出税务申报表
   */
  @Get('declaration/:year/:month/export')
  async exportDeclaration(
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    const data = await this.taxService.getDeclarationList(year, month);
    
    // 生成申报表数据
    return {
      title: `增值税及所得税申报表`,
      period: `${year}年${month}月`,
      vat: data.vat,
      incomeTax: data.incomeTax,
      generateTime: new Date().toISOString(),
    };
  }
}