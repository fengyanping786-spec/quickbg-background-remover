import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { VoucherService, CreateVoucherDto } from './voucher.service';
import { AttachmentService } from './attachment.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/vouchers')
@UseGuards(RolesGuard)
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly attachmentService: AttachmentService,
  ) {}

  private getTenantContext(req: any): { tenantId?: string; year?: number } {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const year = req.headers['x-year'] ? parseInt(req.headers['x-year']) : undefined;
    return { tenantId, year };
  }

  // ========== 凭证列表 ==========
  @Get()
  // @RequirePermissions(PermissionKeys.VOUCHER_READ)
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: number) {
    return this.voucherService.findAll(page ? parseInt(String(page)) : 1, pageSize ? parseInt(String(pageSize)) : 20);
  }

  // ========== 凭证模板 - 必须在 :id 之前 ==========
  @Get('templates')
  @RequirePermissions(PermissionKeys.VOUCHER_READ)
  getTemplates() {
    return this.voucherService.getTemplates();
  }

  @Post('templates/init')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  initTemplates() {
    return this.voucherService.initDefaultTemplates();
  }

  @Post('templates/:id/use')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  useTemplate(
    @Param('id') id: string,
    @Body() body: { amount: number; remark?: string },
  ) {
    return this.voucherService.createFromTemplate(id, body.amount, body.remark);
  }

  @Post('templates')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  createTemplate(@Body() data: any) {
    return this.voucherService.createTemplate(data);
  }

  @Put('templates/:id')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.voucherService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  @RequirePermissions(PermissionKeys.VOUCHER_DELETE)
  deleteTemplate(@Param('id') id: string) {
    return this.voucherService.deleteTemplate(id);
  }

  // ========== 凭证断号整理 ==========
  @Get('numbers')
  getVoucherNumbers() {
    return this.voucherService.getVoucherNumbers();
  }

  @Get('numbers/detect')
  detectBrokenNumbers() {
    return this.voucherService.detectBrokenNumbers();
  }

  @Post('numbers/reorganize')
  reorganizeNumbers() {
    return this.voucherService.reorganizeNumbers();
  }

  // ========== 单个凭证 - 必须在模板路由之后 ==========
  @Get(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_READ)
  findOne(@Param('id') id: string) {
    return this.voucherService.findOne(id);
  }

  @Get(':id/with-items')
  @RequirePermissions(PermissionKeys.VOUCHER_READ)
  findOneWithItems(@Param('id') id: string) {
    return this.voucherService.findOneWithItems(id);
  }

  @Post()
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  create(@Body() data: CreateVoucherDto, @Req() req: any) {
    const { tenantId, year } = this.getTenantContext(req);
    return this.voucherService.create({ ...data, tenantId, year });
  }

  @Put(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  update(@Param('id') id: string, @Body() data: Partial<CreateVoucherDto>) {
    return this.voucherService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_DELETE)
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.voucherService.approve(id, 'test-user', '测试用户');
  }

  @Post(':id/post')
  post(@Param('id') id: string) {
    return this.voucherService.post(id, 'test-user');
  }

  @Post(':id/unapprove')
  unapprove(@Param('id') id: string) {
    return this.voucherService.unapprove(id);
  }

  @Post(':id/unpost')
  unpost(@Param('id') id: string) {
    return this.voucherService.unpost(id);
  }

  @Post('batch-approve')
  batchApprove(@Body() body: { ids: string[] }) {
    return this.voucherService.batchApprove(body.ids, 'test-user', '测试用户');
  }

  @Post('batch-delete')
  batchDelete(@Body() body: { ids: string[] }) {
    return this.voucherService.batchDelete(body.ids);
  }

  // ========== 凭证附件管理 ==========
  @Get(':id/attachments')
  getAttachments(@Param('id') id: string) {
    return this.attachmentService.getAttachments(id);
  }

  @Post(':id/attachments')
  uploadAttachment(
    @Param('id') id: string,
    @Body() body: { fileName: string; fileType: string; fileSize: number; filePath: string },
  ) {
    return this.attachmentService.uploadAttachment(id, {
      originalName: body.fileName,
      mimeType: body.fileType,
      size: body.fileSize,
      path: body.filePath,
    }, 'admin', '管理员');
  }

  @Delete('attachments/:attachmentId')
  deleteAttachment(@Param('attachmentId') attachmentId: string) {
    return this.attachmentService.deleteAttachment(attachmentId);
  }

  // ========== 电子档案库 ==========
  @Get('attachments/all')
  getAllAttachments(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.attachmentService.getAllAttachments(page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 20);
  }

  @Get('attachments/search')
  searchAttachments(@Query('keyword') keyword: string) {
    return this.attachmentService.searchAttachments(keyword);
  }
}