import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

// OCR识别结果
export interface OcrResult {
  success: boolean;
  invoiceNo?: string;
  sellerName?: string;
  sellerTaxNo?: string;
  buyerName?: string;
  buyerTaxNo?: string;
  amount?: number;
  taxRate?: number;
  date?: string;
  rawText?: string;
  error?: string;
}

@Injectable()
export class OcrService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * 模拟OCR识别 - 实际项目中应接入百度/阿里OCR API
   * 这里模拟从图片URL识别发票信息
   */
  async recognizeFromUrl(imageUrl: string): Promise<OcrResult> {
    // 模拟OCR识别结果
    // 实际项目中应调用第三方OCR服务
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回模拟的识别结果
    return {
      success: true,
      invoiceNo: 'FP' + Date.now().toString().slice(-8),
      sellerName: '北京某某科技有限公司',
      sellerTaxNo: '91110000XXXXXXXX',
      buyerName: '上海某某企业',
      buyerTaxNo: '91310000XXXXXXXX',
      amount: 11300,
      taxRate: 13,
      date: new Date().toISOString().split('T')[0],
      rawText: '模拟OCR识别原始文本...',
    };
  }

  /**
   * 模拟OCR识别 - 从Base64图片识别
   */
  async recognizeFromBase64(base64Image: string): Promise<OcrResult> {
    // 模拟OCR处理
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      invoiceNo: 'FP' + Date.now().toString().slice(-8),
      sellerName: '深圳某某贸易有限公司',
      sellerTaxNo: '91440300XXXXXXXX',
      buyerName: '广州某某公司',
      buyerTaxNo: '91440100XXXXXXXX',
      amount: 22600,
      taxRate: 13,
      date: new Date().toISOString().split('T')[0],
      rawText: 'Base64图片OCR识别结果...',
    };
  }

  /**
   * 验证OCR识别结果（人工核对）
   */
  async verifyOcrResult(data: {
    invoiceNo: string;
    sellerName: string;
    amount: number;
    taxRate: number;
  }): Promise<{ valid: boolean; message: string }> {
    // 验证发票号码格式
    if (!data.invoiceNo || data.invoiceNo.length < 8) {
      return { valid: false, message: '发票号码格式不正确' };
    }

    // 验证金额
    if (!data.amount || data.amount <= 0) {
      return { valid: false, message: '金额不正确' };
    }

    // 验证税率
    const validRates = [0, 1, 3, 6, 9, 13];
    if (!validRates.includes(data.taxRate)) {
      return { valid: false, message: '税率不在有效范围内' };
    }

    // 验证是否已存在
    const existing = await this.invoiceRepository.findOne({
      where: { invoiceNo: data.invoiceNo, amount: data.amount },
    });
    if (existing) {
      return { valid: false, message: '该发票已存在' };
    }

    return { valid: true, message: '验证通过' };
  }

  // ========== Controller调用的方法 ==========

  /**
   * OCR识别图片（对应 controller 的 recognizeImage）
   */
  async recognizeImage(imageUrl: string): Promise<OcrResult> {
    return this.recognizeFromUrl(imageUrl);
  }

  /**
   * 发票真伪验证（对应 controller 的 verifyInvoice）
   * 实际项目中应调用税务平台API
   */
  async verifyInvoice(invoiceNo: string, code: string): Promise<{ valid: boolean; message: string }> {
    // 模拟税务平台验证
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 简单模拟：发票号长度大于8位视为有效
    if (invoiceNo && invoiceNo.length >= 8) {
      return { valid: true, message: '发票验证通过' };
    }
    
    return { valid: false, message: '发票号码格式不正确，无法验证' };
  }
}