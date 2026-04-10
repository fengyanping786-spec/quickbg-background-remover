import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';

export interface Attachment {
  id: string;
  voucherId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
  uploaderId: string;
  uploaderName: string;
}

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
  ) {}

  // 上传凭证附件
  async uploadAttachment(
    voucherId: string,
    file: {
      originalName: string;
      mimeType: string;
      size: number;
      path: string;
    },
    uploaderId: string,
    uploaderName: string,
  ): Promise<Attachment> {
    // 检查凭证是否存在
    const voucher = await this.voucherRepository.findOne({ where: { id: voucherId } });
    if (!voucher) {
      throw new NotFoundException('凭证不存在');
    }

    // 模拟附件保存
    const attachment: Attachment = {
      id: 'att_' + Date.now(),
      voucherId,
      fileName: file.originalName,
      fileType: file.mimeType,
      fileSize: file.size,
      filePath: file.path || `/uploads/attachments/${file.originalName}`,
      uploadedAt: new Date(),
      uploaderId,
      uploaderName,
    };

    // 实际项目中应保存到数据库或云存储
    // 这里返回模拟数据
    return attachment;
  }

  // 获取凭证附件列表
  async getAttachments(voucherId: string): Promise<Attachment[]> {
    // 模拟附件数据
    return [
      {
        id: 'att_001',
        voucherId,
        fileName: '发票扫描件.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        filePath: '/uploads/attachments/invoice_001.pdf',
        uploadedAt: new Date('2026-03-15'),
        uploaderId: 'admin',
        uploaderName: '管理员',
      },
      {
        id: 'att_002',
        voucherId,
        fileName: '合同附件.jpg',
        fileType: 'image/jpeg',
        fileSize: 2048000,
        filePath: '/uploads/attachments/contract_001.jpg',
        uploadedAt: new Date('2026-03-16'),
        uploaderId: 'admin',
        uploaderName: '管理员',
      },
    ];
  }

  // 下载附件
  async downloadAttachment(attachmentId: string): Promise<{
    fileName: string;
    fileType: string;
    filePath: string;
  }> {
    // 模拟返回
    return {
      fileName: '发票扫描件.pdf',
      fileType: 'application/pdf',
      filePath: '/uploads/attachments/invoice_001.pdf',
    };
  }

  // 删除附件
  async deleteAttachment(attachmentId: string): Promise<{ success: boolean }> {
    // 模拟删除
    return { success: true };
  }

  // 获取所有附件（电子档案库）
  async getAllAttachments(
    page = 1,
    pageSize = 20,
  ): Promise<{ data: Attachment[]; total: number }> {
    const mockData: Attachment[] = [
      { id: 'att_001', voucherId: 'v1', fileName: '发票扫描件.pdf', fileType: 'application/pdf', fileSize: 1024000, filePath: '/uploads/attachments/invoice_001.pdf', uploadedAt: new Date('2026-03-15'), uploaderId: 'admin', uploaderName: '管理员' },
      { id: 'att_002', voucherId: 'v2', fileName: '合同附件.jpg', fileType: 'image/jpeg', fileSize: 2048000, filePath: '/uploads/attachments/contract_001.jpg', uploadedAt: new Date('2026-03-16'), uploaderId: 'admin', uploaderName: '管理员' },
      { id: 'att_003', voucherId: 'v3', fileName: '银行回单.png', fileType: 'image/png', fileSize: 512000, filePath: '/uploads/attachments/bank_001.png', uploadedAt: new Date('2026-03-17'), uploaderId: 'admin', uploaderName: '管理员' },
    ];

    const start = (page - 1) * pageSize;
    return {
      data: mockData.slice(start, start + pageSize),
      total: mockData.length,
    };
  }

  // 搜索附件
  async searchAttachments(keyword: string): Promise<Attachment[]> {
    // 按文件名搜索
    const all = await this.getAllAttachments(1, 100);
    return all.data.filter(a => a.fileName.includes(keyword));
  }
}