import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { ExcelExportService } from './excel-export.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserRole])],
  controllers: [UserController, BackupController, SummaryController, SystemController, DataController],
  providers: [UserService, BackupService, SummaryService, SystemService, DataService, ExcelExportService, RolesGuard],
  exports: [UserService, BackupService, SummaryService, SystemService, DataService, ExcelExportService],
})
export class CommonModule {}