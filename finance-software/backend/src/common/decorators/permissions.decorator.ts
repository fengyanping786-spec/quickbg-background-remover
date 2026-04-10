import { SetMetadata } from '@nestjs/common';

// 权限装饰器 - 使用方式: @RequirePermissions('account:read', 'account:write')
export const RequirePermissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// 快捷方式：用于批量设置权限
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// 权限列表
export const PermissionKeys = {
  // 账户
  ACCOUNT_READ: 'account:read',
  ACCOUNT_WRITE: 'account:write',
  ACCOUNT_DELETE: 'account:delete',

  // 凭证
  VOUCHER_READ: 'voucher:read',
  VOUCHER_WRITE: 'voucher:write',
  VOUCHER_APPROVE: 'voucher:approve',
  VOUCHER_DELETE: 'voucher:delete',

  // 账簿
  ACCOUNT_BOOK_READ: 'account_book:read',
  ACCOUNT_BOOK_PRINT: 'account_book:print',

  // 发票
  INVOICE_READ: 'invoice:read',
  INVOICE_WRITE: 'invoice:write',
  INVOICE_DELETE: 'invoice:delete',

  // 报表
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',

  // 税务
  TAX_READ: 'tax:read',
  TAX_WRITE: 'tax:write',

  // 用户
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',

  // 账套
  TENANT_READ: 'tenant:read',
  TENANT_WRITE: 'tenant:write',
  TENANT_DELETE: 'tenant:delete',

  // 备份
  BACKUP_READ: 'backup:read',
  BACKUP_WRITE: 'backup:write',

  // 系统
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
};