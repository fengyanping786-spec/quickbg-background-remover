import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodEndJob } from './entities/period-end-job.entity';
import { PeriodEndController } from './period-end.controller';
import { PeriodEndService } from './period-end.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodEndJob])],
  controllers: [PeriodEndController],
  providers: [PeriodEndService],
  exports: [PeriodEndService],
})
export class PeriodEndModule {}