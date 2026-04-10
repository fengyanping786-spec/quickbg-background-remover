import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const stat = promisify(fs.stat);

export interface BackupOptions {
  includePublicDb: boolean;     // 是否包含公共数据库
  includeTenantDbs: boolean;    // 是否包含账套数据库
  includeFiles: boolean;        // 是否包含上传文件
  compress: boolean;             // 是否压缩
  encryption: boolean;          // 是否加密
  encryptionKey?: string;       // 加密密钥
}

export interface BackupInfo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  options: BackupOptions;
  status: 'completed' | 'failed';
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = process.env.BACKUP_DIR || '/tmp/finance-backups';

  /**
   * 创建数据库备份
   */
  async createBackup(options: Partial<BackupOptions> = {}): Promise<BackupInfo> {
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `finance_backup_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const finalOptions: BackupOptions = {
      includePublicDb: true,
      includeTenantDbs: true,
      includeFiles: true,
      compress: true,
      encryption: false,
      ...options,
    };

    try {
      this.logger.log(`开始创建备份: ${backupId}`);

      // 生成 SQL 备份内容
      const sqlContent = await this.generateBackupContent(finalOptions);

      let finalContent: Buffer;
      if (finalOptions.encryption && finalOptions.encryptionKey) {
        // 加密
        finalContent = this.encrypt(sqlContent, finalOptions.encryptionKey);
      } else {
        finalContent = Buffer.from(sqlContent, 'utf-8');
      }

      // 写入文件
      fs.writeFileSync(filePath, finalContent);

      const stats = fs.statSync(filePath);

      const backupInfo: BackupInfo = {
        id: backupId,
        fileName,
        filePath,
        fileSize: stats.size,
        createdAt: new Date(),
        options: finalOptions,
        status: 'completed',
      };

      // 保存备份元信息
      await this.saveBackupMeta(backupInfo);

      this.logger.log(`备份完成: ${backupId}, 大小: ${stats.size} bytes`);

      return backupInfo;
    } catch (error) {
      this.logger.error(`备份失败: ${error.message}`);
      return {
        id: backupId,
        fileName,
        filePath,
        fileSize: 0,
        createdAt: new Date(),
        options: finalOptions,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * 恢复数据库
   */
  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const backupMeta = await this.getBackupMeta(backupId);
    if (!backupMeta) {
      return { success: false, message: '备份记录不存在' };
    }

    try {
      let content = fs.readFileSync(backupMeta.filePath, 'utf-8');

      // 解密（如果需要）
      if (backupMeta.options.encryption && backupMeta.options.encryptionKey) {
        content = this.decrypt(content, backupMeta.options.encryptionKey);
      }

      // 执行 SQL 恢复
      await this.executeRestore(content);

      this.logger.log(`恢复成功: ${backupId}`);
      return { success: true, message: '恢复成功' };
    } catch (error) {
      this.logger.error(`恢复失败: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取备份列表
   */
  async listBackups(): Promise<BackupInfo[]> {
    const metaPath = path.join(this.backupDir, 'backup_meta.json');
    if (!fs.existsSync(metaPath)) {
      return [];
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    return meta.backups || [];
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    const backups = await this.listBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) return false;

    // 删除文件
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // 更新元信息
    const remaining = backups.filter(b => b.id !== backupId);
    fs.writeFileSync(
      path.join(this.backupDir, 'backup_meta.json'),
      JSON.stringify({ backups: remaining }, null, 2)
    );

    return true;
  }

  /**
   * 定时自动备份
   */
  async scheduleBackup(cronExpression: string): Promise<void> {
    // 使用 node-cron 或系统 cron
    this.logger.log(`定时备份已配置: ${cronExpression}`);
    // 实际实现需要集成 node-schedule 或类似的定时任务库
  }

  // ========== 私有方法 ==========

  private async generateBackupContent(options: BackupOptions): Promise<string> {
    const statements: string[] = [];

    // 头部信息
    statements.push('-- ============================================');
    statements.push('-- 财务系统数据库备份');
    statements.push(`-- 备份时间: ${new Date().toISOString()}`);
    statements.push('-- ============================================');
    statements.push('');

    // 公共数据库备份
    if (options.includePublicDb) {
      statements.push('-- 公共数据库 (finance_pub)');
      statements.push('-- 用户表');
      statements.push('CREATE TABLE IF NOT EXISTS users (...);');
      statements.push('-- 角色表');
      statements.push('CREATE TABLE IF NOT EXISTS roles (...);');
      statements.push('-- 账套表');
      statements.push('CREATE TABLE IF NOT EXISTS tenants (...);');
      statements.push('');
    }

    // 账套数据库备份
    if (options.includeTenantDbs) {
      statements.push('-- 账套数据库备份 (模拟)');
      statements.push('-- 账户表');
      statements.push('CREATE TABLE IF NOT EXISTS accounts (...);');
      statements.push('-- 凭证表');
      statements.push('CREATE TABLE IF NOT EXISTS vouchers (...);');
      statements.push('-- 凭证分录表');
      statements.push('CREATE TABLE IF NOT EXISTS voucher_items (...);');
      statements.push('-- 发票表');
      statements.push('CREATE TABLE IF NOT EXISTS invoices (...);');
      statements.push('');
    }

    // 文件备份清单
    if (options.includeFiles) {
      statements.push('-- 文件备份清单');
      statements.push('-- /uploads/invoices/');
      statements.push('-- /uploads/attachments/');
      statements.push('');
    }

    statements.push('-- 备份完成');

    return statements.join('\n');
  }

  private async executeRestore(sqlContent: string): Promise<void> {
    // 实际实现需要连接数据库执行 SQL
    this.logger.log('执行数据库恢复...');
    // const client = new Client({...});
    // await client.connect();
    // await client.query(sqlContent);
    // await client.end();
  }

  private encrypt(content: string, key: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
  }

  private decrypt(content: string, key: string): string {
    const buffer = Buffer.from(content, 'base64');
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  private async saveBackupMeta(backup: BackupInfo): Promise<void> {
    const metaPath = path.join(this.backupDir, 'backup_meta.json');
    let meta: any = { backups: [] };
    
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    meta.backups.unshift(backup);
    
    // 只保留最近 30 个备份
    meta.backups = meta.backups.slice(0, 30);

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  private async getBackupMeta(backupId: string): Promise<BackupInfo | null> {
    const backups = await this.listBackups();
    return backups.find(b => b.id === backupId) || null;
  }
}