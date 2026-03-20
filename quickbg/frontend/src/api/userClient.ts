/**
 * 用户API客户端
 * 处理所有用户相关的API调用
 */

import { 
  User, 
  UserSettings, 
  Subscription, 
  UserStats, 
  ProcessingHistory, 
  ApiKey,
  Notification,
  UserPreferences,
  Organization,
  OrganizationMember
} from '../types/user'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class UserClient {
  private baseUrl: string
  private token: string | null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    this.token = localStorage.getItem('quickbg_token')
  }

  // 设置认证令牌
  setToken(token: string): void {
    this.token = token
    localStorage.setItem('quickbg_token', token)
  }

  // 清除认证令牌
  clearToken(): void {
    this.token = null
    localStorage.removeItem('quickbg_token')
  }

  // 获取认证头
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  // 处理API响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `请求失败: ${response.status}`,
        message: data.message
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message
    }
  }

  // 用户信息相关API

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/me`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<User>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败'
      }
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/me`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return this.handleResponse<User>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新用户信息失败'
      }
    }
  }

  /**
   * 删除用户账户
   */
  async deleteUser(password: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/me`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ password })
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除账户失败'
      }
    }
  }

  // 用户设置相关API

  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/settings`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<UserSettings>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户设置失败'
      }
    }
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings)
      })
      return this.handleResponse<UserSettings>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新用户设置失败'
      }
    }
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/preferences`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<UserPreferences>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户偏好失败'
      }
    }
  }

  /**
   * 更新用户偏好
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences)
      })
      return this.handleResponse<UserPreferences>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新用户偏好失败'
      }
    }
  }

  // 订阅相关API

  /**
   * 获取用户订阅信息
   */
  async getSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/subscription`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<Subscription>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取订阅信息失败'
      }
    }
  }

  /**
   * 升级订阅
   */
  async upgradeSubscription(plan: string, paymentMethodId?: string): Promise<ApiResponse<Subscription>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/subscription/upgrade`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ plan, paymentMethodId })
      })
      return this.handleResponse<Subscription>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '升级订阅失败'
      }
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/subscription/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<Subscription>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消订阅失败'
      }
    }
  }

  /**
   * 恢复订阅
   */
  async resumeSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/subscription/resume`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<Subscription>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '恢复订阅失败'
      }
    }
  }

  // 使用统计相关API

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/stats`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<UserStats>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户统计失败'
      }
    }
  }

  /**
   * 获取使用量详情
   */
  async getUsageDetails(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`${this.baseUrl}/api/user/usage?${params.toString()}`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<any>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取使用量详情失败'
      }
    }
  }

  // 处理历史相关API

  /**
   * 获取处理历史列表
   */
  async getProcessingHistory(
    page = 1,
    limit = 20,
    filters?: {
      startDate?: string
      endDate?: string
      status?: string
      format?: string
      starred?: boolean
    }
  ): Promise<ApiResponse<{ items: ProcessingHistory[]; total: number; page: number; limit: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (filters) {
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        if (filters.status) params.append('status', filters.status)
        if (filters.format) params.append('format', filters.format)
        if (filters.starred !== undefined) params.append('starred', filters.starred.toString())
      }

      const response = await fetch(`${this.baseUrl}/api/user/history?${params.toString()}`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取处理历史失败'
      }
    }
  }

  /**
   * 获取单个历史记录
   */
  async getHistoryItem(id: string): Promise<ApiResponse<ProcessingHistory>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/history/${id}`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<ProcessingHistory>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取历史记录失败'
      }
    }
  }

  /**
   * 标记历史记录
   */
  async starHistoryItem(id: string, starred: boolean): Promise<ApiResponse<ProcessingHistory>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/history/${id}/star`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ starred })
      })
      return this.handleResponse<ProcessingHistory>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '标记历史记录失败'
      }
    }
  }

  /**
   * 删除历史记录
   */
  async deleteHistoryItem(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/history/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除历史记录失败'
      }
    }
  }

  /**
   * 批量删除历史记录
   */
  async deleteHistoryItems(ids: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/history/batch`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ids })
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量删除历史记录失败'
      }
    }
  }

  // API密钥相关API

  /**
   * 获取API密钥列表
   */
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/api-keys`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<ApiKey[]>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取API密钥失败'
      }
    }
  }

  /**
   * 创建API密钥
   */
  async createApiKey(name: string, permissions?: any): Promise<ApiResponse<ApiKey>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/api-keys`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name, permissions })
      })
      return this.handleResponse<ApiKey>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建API密钥失败'
      }
    }
  }

  /**
   * 更新API密钥
   */
  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/api-keys/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return this.handleResponse<ApiKey>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新API密钥失败'
      }
    }
  }

  /**
   * 删除API密钥
   */
  async deleteApiKey(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/api-keys/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除API密钥失败'
      }
    }
  }

  // 通知相关API

  /**
   * 获取通知列表
   */
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<ApiResponse<{ items: Notification[]; total: number; unreadCount: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      })

      const response = await fetch(`${this.baseUrl}/api/user/notifications?${params.toString()}`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取通知失败'
      }
    }
  }

  /**
   * 标记通知为已读
   */
  async markNotificationAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/notifications/${id}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<Notification>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '标记通知失败'
      }
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/notifications/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '标记所有通知失败'
      }
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/notifications/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除通知失败'
      }
    }
  }

  // 组织相关API

  /**
   * 获取用户所属组织
   */
  async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/organizations`, {
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<Organization[]>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取组织失败'
      }
    }
  }

  /**
   * 创建组织
   */
  async createOrganization(data: Partial<Organization>): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/organizations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return this.handleResponse<Organization>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建组织失败'
      }
    }
  }

  /**
   * 更新组织
   */
  async updateOrganization(id: string, data: Partial<Organization>): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/organizations/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return this.handleResponse<Organization>(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新