import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService, CreateUserDto, UpdateUserDto, AssignRoleDto } from './user.service';
import { RolesGuard } from './guards/roles.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { PermissionKeys } from './decorators/permissions.decorator';

@Controller('v1/users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ========== 用户管理 ==========

  @Post()
  @RequirePermissions(PermissionKeys.USER_WRITE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @RequirePermissions(PermissionKeys.USER_READ)
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.userService.findAll(tenantId, page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 20);
  }

  @Get(':id')
  @RequirePermissions(PermissionKeys.USER_READ)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PermissionKeys.USER_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKeys.USER_DELETE)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/change-password')
  changePassword(
    @Param('id') id: string,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(id, body.oldPassword, body.newPassword);
  }

  // ========== 角色管理 ==========

  @Get('roles')
  getRoles() {
    return this.userService.getRoles();
  }

  @Post('roles/init')
  initRoles() {
    return this.userService.initDefaultRoles();
  }

  @Post('roles')
  @RequirePermissions(PermissionKeys.USER_WRITE)
  createRole(@Body() data: any) {
    return this.userService.createRole(data);
  }

  @Put('roles/:id')
  @RequirePermissions(PermissionKeys.USER_WRITE)
  updateRole(@Param('id') id: string, @Body() data: any) {
    return this.userService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @RequirePermissions(PermissionKeys.USER_DELETE)
  deleteRole(@Param('id') id: string) {
    return this.userService.deleteRole(id);
  }

  // ========== 用户角色关联 ==========

  @Post(':id/roles')
  @RequirePermissions(PermissionKeys.USER_WRITE)
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.userService.assignRole(id, dto.roleId);
  }

  @Get(':id/permissions')
  getUserPermissions(@Param('id') id: string) {
    return this.userService.getUserPermissions(id);
  }
}