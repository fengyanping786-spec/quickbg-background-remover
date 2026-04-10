import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { Role, DEFAULT_ROLES } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

export interface CreateUserDto {
  username: string;
  password: string;
  realName: string;
  email: string;
  phone?: string;
  tenantId?: string;
}

export interface UpdateUserDto {
  realName?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  tenantId?: string;
}

export interface AssignRoleDto {
  roleId: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  // ========== 用户管理 ==========

  /**
   * 创建用户
   */
  async create(dto: CreateUserDto): Promise<User> {
    // 密码加密（实际使用 bcrypt）
    const hashedPassword = this.hashPassword(dto.password);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  /**
   * 分页查询用户
   */
  async findAll(tenantId?: string, page = 1, pageSize = 10): Promise<{ data: User[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder('user');
    if (tenantId) qb.where('user.tenantId = :tenantId', { tenantId });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { data, total };
  }

  /**
   * 根据 ID 查询用户
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  /**
   * 根据用户名查询（登录用）
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * 更新用户
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * 删除用户
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * 修改密码
   */
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    if (user.password !== this.hashPassword(oldPassword)) {
      throw new Error('原密码错误');
    }
    user.password = this.hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  // ========== 角色管理 ==========

  /**
   * 获取角色列表
   */
  async getRoles(): Promise<Role[]> {
    return this.roleRepository.find({ where: { isActive: true } });
  }

  /**
   * 初始化默认角色
   */
  async initDefaultRoles(): Promise<void> {
    const count = await this.roleRepository.count();
    if (count > 0) return;

    for (const role of DEFAULT_ROLES) {
      const r = this.roleRepository.create(role);
      await this.roleRepository.save(r);
    }
  }

  /**
   * 创建角色
   */
  async createRole(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) throw new NotFoundException('角色不存在');
    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) throw new NotFoundException('角色不存在');
    await this.roleRepository.remove(role);
  }

  // ========== 用户角色关联 ==========

  /**
   * 给用户分配角色
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    // 先删除原有角色
    await this.userRoleRepository.delete({ userId });
    // 分配新角色
    const userRole = this.userRoleRepository.create({ userId, roleId });
    await this.userRoleRepository.save(userRole);
  }

  /**
   * 获取用户的权限列表
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({ where: { userId } });
    const roleIds = userRoles.map(ur => ur.roleId);
    if (roleIds.length === 0) return [];

    const roles = await this.roleRepository.findByIds(roleIds);
    const permissions = new Set<string>();
    roles.forEach(role => {
      role.permissions?.forEach(p => permissions.add(p));
    });

    return Array.from(permissions);
  }

  // 密码哈希（简化版）
  private hashPassword(password: string): string {
    // 实际使用 bcrypt，这里简单模拟
    return `hashed:${password}`;
  }
}