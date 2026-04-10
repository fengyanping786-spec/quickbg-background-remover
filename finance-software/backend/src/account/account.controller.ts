import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AccountService, CreateAccountDto, UpdateAccountDto, TransferDto } from './account.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/accounts')
@UseGuards(RolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // 从请求中获取 tenantId 和 year
  private getTenantContext(req: any): { tenantId?: string; year?: number } {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const year = req.headers['x-year'] ? parseInt(req.headers['x-year']) : undefined;
    return { tenantId, year };
  }

  /**
   * POST /accounts - 创建账户
   */
  @Post()
  @RequirePermissions(PermissionKeys.ACCOUNT_WRITE)
  create(@Body() dto: CreateAccountDto, @Req() req: any) {
    const { tenantId, year } = this.getTenantContext(req);
    return this.accountService.create(dto, tenantId, year);
  }

  /**
   * GET /accounts - 获取账户列表
   */
  @Get()
  @RequirePermissions(PermissionKeys.ACCOUNT_READ)
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: number,
    @Req() req: any,
  ) {
    const { tenantId, year } = this.getTenantContext(req);
    return this.accountService.findAll(page ? parseInt(String(page)) : 1, pageSize ? parseInt(String(pageSize)) : 20, tenantId, year);
  }

  /**
   * GET /accounts/:id - 获取账户详情
   */
  @Get(':id')
  @RequirePermissions(PermissionKeys.ACCOUNT_READ)
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  /**
   * PUT /accounts/:id - 更新账户
   */
  @Put(':id')
  @RequirePermissions(PermissionKeys.ACCOUNT_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.update(id, dto);
  }

  /**
   * DELETE /accounts/:id - 删除账户
   */
  @Delete(':id')
  @RequirePermissions(PermissionKeys.ACCOUNT_DELETE)
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }

  /**
   * POST /accounts/transfer - 账户间转账
   */
  @Post('transfer')
  @RequirePermissions(PermissionKeys.ACCOUNT_WRITE)
  transfer(@Body() dto: TransferDto) {
    return this.accountService.transfer(dto);
  }

  /**
   * GET /accounts/summary/balance - 获取总余额
   */
  @Get('summary/balance')
  @RequirePermissions(PermissionKeys.ACCOUNT_READ)
  getTotalBalance() {
    return this.accountService.getTotalBalance();
  }
}