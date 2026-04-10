import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, PermissionKeys } from '../common/decorators/permissions.decorator';

@Controller('v1/tenants')
@UseGuards(RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // 账套列表
  @Get()
  @RequirePermissions(PermissionKeys.TENANT_READ)
  findAll() {
    return this.tenantService.findAll();
  }

  // 账套详情
  @Get(':id')
  @RequirePermissions(PermissionKeys.TENANT_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.findById(id);
  }

  // 创建账套
  @Post()
  @RequirePermissions(PermissionKeys.TENANT_WRITE)
  create(@Body() data: any) {
    return this.tenantService.create(data);
  }

  // 更新账套
  @Put(':id')
  @RequirePermissions(PermissionKeys.TENANT_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.tenantService.update(id, data);
  }

  // 删除账套
  @Delete(':id')
  @RequirePermissions(PermissionKeys.TENANT_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.delete(id);
  }

  // 启用/停用账套
  @Put(':id/status')
  @RequirePermissions(PermissionKeys.TENANT_WRITE)
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tenantService.setStatus(id, isActive);
  }

  // 初始化账套数据库
  @Post(':id/init-database')
  @RequirePermissions(PermissionKeys.TENANT_WRITE)
  initDatabase(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.findById(id).then(tenant => 
      this.tenantService.initDatabase(tenant)
    );
  }
}