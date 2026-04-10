import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { VoucherWordService } from './voucher-word.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/voucher-words')
@UseGuards(RolesGuard)
export class VoucherWordController {
  constructor(private readonly voucherWordService: VoucherWordService) {}

  private getTenantContext(query: any): { tenantId: string; year: number } {
    const tenantId = query.tenantId || 'default';
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    return { tenantId, year };
  }

  // 凭证字列表
  @Get()
  @RequirePermissions(PermissionKeys.VOUCHER_READ)
  findAll(@Query() query: any) {
    const { tenantId, year } = this.getTenantContext(query);
    return this.voucherWordService.findAll(tenantId, year);
  }

  // 凭证字详情
  @Get(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voucherWordService.findById(id);
  }

  // 创建凭证字
  @Post()
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  create(@Body() data: any) {
    return this.voucherWordService.create(data);
  }

  // 更新凭证字
  @Put(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.voucherWordService.update(id, data);
  }

  // 删除凭证字
  @Delete(':id')
  @RequirePermissions(PermissionKeys.VOUCHER_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.voucherWordService.delete(id);
  }

  // 设置默认
  @Put(':id/set-default')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  setDefault(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    const { tenantId, year } = this.getTenantContext(query);
    return this.voucherWordService.setDefault(id, tenantId, year);
  }

  // 初始化默认凭证字
  @Post('init')
  @RequirePermissions(PermissionKeys.VOUCHER_WRITE)
  initDefault(@Query() query: any) {
    const { tenantId, year } = this.getTenantContext(query);
    return this.voucherWordService.initDefault(tenantId, year);
  }
}