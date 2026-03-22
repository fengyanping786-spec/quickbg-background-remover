/**
 * 用户相关类型定义
 */

// 用户基本信息
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  isVerified: boolean
  isActive: boolean
}

// 用户配置
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh' | 'en'
  notification: {
    email: boolean
    push: boolean
    processingComplete: boolean
    monthlyReport: boolean
  }
  privacy: {
    saveHistory: boolean
    shareAnalytics: boolean
    autoDeleteHistory: number // 天数，0表示不删除
  }
  processing: {
    defaultFormat: 'png' | 'jpg' | 'webp'
    defaultQuality: number
    autoCompress: boolean
    removeShadow: boolean
    enhanceEdges: boolean
  }
}

// 用户订阅信息
export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'canceled' | 'expired' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  features: {
    maxImagesPerMonth: number
    maxFileSize: number // MB
    batchProcessing: boolean
    priorityProcessing: boolean
    apiAccess: boolean
    customBranding: boolean
    dedicatedSupport: boolean
  }
  usage: {
    imagesProcessedThisMonth: number
    totalImagesProcessed: number
    storageUsed: number // MB
    apiCallsThisMonth: number
  }
}

// 用户统计
export interface UserStats {
  totalImagesProcessed: number
  imagesProcessedThisMonth: number
  totalProcessingTime: number // 秒
  averageProcessingTime: number // 秒
  successRate: number // 百分比
  favoriteFormats: Array<{
    format: string
    count: number
    percentage: number
  }>
  monthlyUsage: Array<{
    month: string
    imagesProcessed: number
    processingTime: number
  }>
}

// 处理历史记录
export interface ProcessingHistory {
  id: string
  userId: string
  originalImage: {
    name: string
    size: number
    type: string
    dimensions?: {
      width: number
      height: number
    }
  }
  processedImage: {
    url: string
    format: string
    quality: number
    size: number
  }
  settings: {
    format: string
    quality: number
    removeShadow: boolean
    enhanceEdges: boolean
    autoCrop: boolean
  }
  processingTime: number // 毫秒
  status: 'success' | 'failed' | 'processing'
  error?: string
  createdAt: string
  tags?: string[]
  isStarred: boolean
  downloadCount: number
}

// API密钥
export interface ApiKey {
  id: string
  userId: string
  name: string
  key: string
  prefix: string
  lastUsedAt?: string
  createdAt: string
  expiresAt?: string
  permissions: {
    processImages: boolean
    viewHistory: boolean
    downloadImages: boolean
    manageApiKeys: boolean
  }
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
  }
}

// 通知
export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error' | 'processing'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  action?: {
    label: string
    url: string
  }
}

// 登录凭证
export interface AuthCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// 注册信息
export interface RegisterData {
  email: string
  password: string
  name?: string
  acceptTerms: boolean
  newsletter?: boolean
}

// 密码重置
export interface PasswordReset {
  email: string
  token?: string
  newPassword?: string
}

// 社交登录
export interface SocialAuth {
  provider: 'google' | 'github' | 'twitter' | 'facebook'
  token: string
  email?: string
  name?: string
  avatar?: string
}

// 会话信息
export interface Session {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  userAgent: string
  ipAddress?: string
  location?: {
    country?: string
    city?: string
    timezone?: string
  }
  device?: {
    type?: string
    os?: string
    browser?: string
  }
  createdAt: string
  lastActivityAt: string
}

// 用户偏好
export interface UserPreferences {
  ui: {
    compactMode: boolean
    showTutorial: boolean
    animationSpeed: 'slow' | 'normal' | 'fast'
    density: 'comfortable' | 'compact' | 'spacious'
  }
  keyboard: {
    shortcutsEnabled: boolean
    customShortcuts?: Record<string, string>
  }
  export: {
    defaultFormat: 'png' | 'jpg' | 'webp'
    defaultQuality: number
    autoDownload: boolean
    includeMetadata: boolean
    watermark?: {
      enabled: boolean
      text?: string
      opacity: number
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    }
  }
  workspace: {
    defaultView: 'grid' | 'list'
    sortBy: 'date' | 'name' | 'size' | 'type'
    sortOrder: 'asc' | 'desc'
    showFileExtensions: boolean
    showFileSizes: boolean
  }
}

// 团队/组织
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
  settings: {
    maxMembers: number
    defaultRole: 'member' | 'admin'
    requireApproval: boolean
    allowExternalSharing: boolean
  }
}

// 组织成员
export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  joinedAt: string
  invitedBy?: string
  permissions: {
    uploadImages: boolean
    processImages: boolean
    viewAllHistory: boolean
    manageMembers: boolean
    manageBilling: boolean
    manageSettings: boolean
  }
}

// 使用量限制
export interface UsageLimits {
  free: {
    imagesPerMonth: 50
    maxFileSize: 10 // MB
    concurrentProcesses: 1
    historyRetention: 30 // 天
    apiAccess: false
    prioritySupport: false
  }
  basic: {
    imagesPerMonth: 500
    maxFileSize: 25 // MB
    concurrentProcesses: 3
    historyRetention: 90 // 天
    apiAccess: true
    prioritySupport: false
  }
  pro: {
    imagesPerMonth: 5000
    maxFileSize: 50 // MB
    concurrentProcesses: 10
    historyRetention: 365 // 天
    apiAccess: true
    prioritySupport: true
  }
  enterprise: {
    imagesPerMonth: 'unlimited'
    maxFileSize: 100 // MB
    concurrentProcesses: 50
    historyRetention: 'unlimited'
    apiAccess: true
    prioritySupport: true
    customFeatures: true
  }
}