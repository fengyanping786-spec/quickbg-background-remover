import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../common/entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async findAll() {
    return this.tenantRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`账套 ID ${id} 不存在`);
    }
    return tenant;
  }

  async findByCode(code: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { code } });
    if (!tenant) {
      throw new NotFoundException(`账套编码 ${code} 不存在`);
    }
    return tenant;
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    // 生成 dbName
    const dbName = `tenant_${data.code || Date.now()}`;
    
    const tenant = this.tenantRepository.create({
      ...data,
      dbName,
      status: data.status || 'active',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    
    const result = await this.tenantRepository.save(tenant);
    
    // TODO: 创建对应的数据库
    console.log(`创建账套数据库: ${dbName}`);
    
    return result;
  }

  async update(id: number, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);
    Object.assign(tenant, data);
    return this.tenantRepository.save(tenant);
  }

  async delete(id: number): Promise<void> {
    const tenant = await this.findById(id);
    await this.tenantRepository.remove(tenant);
  }

  async initDatabase(tenant: Tenant) {
    // TODO: 执行初始化脚本，创建账套数据库表
    console.log(`创建账套数据库: ${tenant.dbName}`);
    return { success: true, message: `数据库 ${tenant.dbName} 已创建` };
  }

  // 启用/停用账套
  async setStatus(id: number, isActive: boolean): Promise<Tenant> {
    const tenant = await this.findById(id);
    tenant.isActive = isActive;
    tenant.status = isActive ? 'active' : 'inactive';
    return this.tenantRepository.save(tenant);
  }
}