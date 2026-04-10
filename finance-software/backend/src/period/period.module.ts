import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountPeriod } from './entities/period.entity';
import { PeriodController } from './period.controller';
import { PeriodService } from './period.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountPeriod])],
  controllers: [PeriodController],
  providers: [PeriodService],
  exports: [PeriodService],
})
export class PeriodModule {}