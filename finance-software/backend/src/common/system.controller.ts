import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { SystemService, SystemSettings } from './system.service';

@Controller('v1/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // 获取系统设置
  @Get('settings')
  getSettings(@Query('tenantId') tenantId: string) {
    return this.systemService.getSettings(tenantId);
  }

  // 更新系统设置
  @Put('settings')
  updateSettings(
    @Query('tenantId') tenantId: string,
    @Body() settings: Partial<SystemSettings>,
  ) {
    return this.systemService.updateSettings(tenantId, settings);
  }

  // 获取系统信息
  @Get('info')
  getSystemInfo() {
    return this.systemService.getSystemInfo();
  }

  // 系统健康检查
  @Get('health')
  healthCheck() {
    return this.systemService.healthCheck();
  }
}