import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvoiceService, CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryDto } from './invoice.service';
import { Invoice } from './entities/invoice.entity';
import { OcrService } from './ocr.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/invoices')
@UseGuards(RolesGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly ocrService: OcrService,
  ) {}

  /**
   * POST /invoices - 创建发票
   */
  @Post()
  async create(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.create(dto);
  }

  /**
   * GET /invoices - 分页查询发票列表
   */
  @Get()
  async findAll(@Query() query: InvoiceQueryDto): Promise<{ data: Invoice[]; total: number }> {
    return this.invoiceService.findAll(query);
  }

  /**
   * GET /invoices/:id - 获取发票详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoiceService.findOne(id);
  }

  /**
   * PUT /invoices/:id - 更新发票
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.update(id, dto);
  }

  /**
   * DELETE /invoices/:id - 删除发票
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.invoiceService.remove(id);
    return { message: '删除成功' };
  }

  /**
   * POST /invoices/check - 发票查重
   */
  @Post('check')
  async checkDuplicate(
    @Body() body: { invoiceNo: string; amount: number },
  ): Promise<{ exists: boolean; invoice?: Invoice }> {
    const invoice = await this.invoiceService.checkDuplicate(body.invoiceNo, body.amount);
    return { exists: !!invoice, invoice: invoice || undefined };
  }

  /**
   * POST /invoices/:id/bind-voucher - 关联凭证
   */
  @Post(':id/bind-voucher')
  async bindVoucher(
    @Param('id') id: string,
    @Body() body: { voucherId: string },
  ): Promise<Invoice> {
    return this.invoiceService.bindVoucher(id, body.voucherId);
  }

  /**
   * GET /invoices/statistics/summary - 统计报表
   */
  @Get('statistics/summary')
  @RequirePermissions(PermissionKeys.INVOICE_READ)
  async getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.invoiceService.getStatistics(startDate, endDate);
  }

  // ========== OCR 相关 ==========

  /**
   * POST /invoices/ocr/recognize - OCR 识别发票
   */
  @Post('ocr/recognize')
  @RequirePermissions(PermissionKeys.INVOICE_WRITE)
  async recognizeImage(@Body() body: { imageUrl: string }): Promise<any> {
    return this.ocrService.recognizeImage(body.imageUrl);
  }

  /**
   * POST /invoices/ocr/verify - 发票真伪验证
   */
  @Post('ocr/verify')
  @RequirePermissions(PermissionKeys.INVOICE_READ)
  async verifyInvoice(
    @Body() body: { invoiceNo: string; code: string },
  ): Promise<{ valid: boolean; message: string }> {
    return this.ocrService.verifyInvoice(body.invoiceNo, body.code);
  }
}