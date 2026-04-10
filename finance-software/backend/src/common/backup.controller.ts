import { Controller, Get, Post, Delete, Body, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { BackupService, BackupOptions, BackupInfo } from './backup.service';
import { RolesGuard } from './guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { RequirePermissions, PermissionKeys } from './decorators/permissions.decorator';

@Controller('v1/backup')
@UseGuards(RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * POST /backup - 创建备份
   */
  @Post()
  @RequirePermissions(PermissionKeys.SETTINGS_WRITE)
  async createBackup(@Body() options: Partial<BackupOptions>): Promise<BackupInfo> {
    return this.backupService.createBackup(options);
  }

  /**
   * GET /backup - 获取备份列表
   */
  @Get()
  @RequirePermissions(PermissionKeys.SETTINGS_READ)
  async listBackups(): Promise<BackupInfo[]> {
    return this.backupService.listBackups();
  }

  /**
   * GET /backup/:id - 获取备份详情
   */
  @Get(':id')
  @RequirePermissions(PermissionKeys.SETTINGS_READ)
  async getBackup(@Param('id') id: string): Promise<BackupInfo | null> {
    const backups = await this.backupService.listBackups();
    return backups.find(b => b.id === id) || null;
  }

  /**
   * DELETE /backup/:id - 删除备份
   */
  @Delete(':id')
  @RequirePermissions(PermissionKeys.SETTINGS_WRITE)
  async deleteBackup(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const success = await this.backupService.deleteBackup(id);
    return { 
      success, 
      message: success ? '删除成功' : '删除失败' 
    };
  }

  /**
   * POST /backup/:id/restore - 恢复备份
   */
  @Post(':id/restore')
  @RequirePermissions(PermissionKeys.SETTINGS_WRITE)
  async restoreBackup(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.backupService.restoreBackup(id);
  }

  /**
   * GET /backup/:id/download - 下载备份文件
   */
  @Get(':id/download')
  @RequirePermissions(PermissionKeys.SETTINGS_READ)
  async downloadBackup(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const backups = await this.backupService.listBackups();
    const backup = backups.find(b => b.id === id);
    
    if (!backup || !require('fs').existsSync(backup.filePath)) {
      res.status(404).json({ message: '备份文件不存在' });
      return;
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`);
    res.sendFile(backup.filePath);
  }
}