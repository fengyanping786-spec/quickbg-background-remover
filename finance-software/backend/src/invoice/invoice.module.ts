import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { OcrInvoiceService } from './ocr-invoice.service';
import { OcrService } from './ocr.service';
import { Invoice } from './entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, OcrInvoiceService, OcrService],
  exports: [InvoiceService, OcrInvoiceService, OcrService],
})
export class InvoiceModule {}