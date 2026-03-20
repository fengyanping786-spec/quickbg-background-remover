import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session, AuthCredentials, RegisterData, SocialAuth, PasswordReset } from '../types/user'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  socialLogin: (auth: SocialAuth) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (data: PasswordReset) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化：检查本地存储中的会话
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedSession = localStorage.getItem('quickbg_session')
        const storedUser = localStorage.getItem('quickbg_user')

        if (storedSession && storedUser) {
          const parsedSession = JSON.parse(storedSession)
          const parsedUser = JSON.parse(storedUser)

          // 检查会话是否过期
          if (new Date(parsedSession.expiresAt) > new Date()) {
            setSession(parsedSession)
            setUser(parsedUser)
            
            // 刷新会话
            await refreshSession()
          } else {
            // 会话过期，清除存储
            localStorage.removeItem('quickbg_session')
            localStorage.removeItem('quickbg_user')
            localStorage.removeItem('quickbg_token')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // 清除可能损坏的存储
        localStorage.removeItem('quickbg_session')
        localStorage.removeItem('quickbg_user')
        localStorage.removeItem('quickbg_token')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // 保存认证数据到本地存储
  const saveAuthData = (userData: User, sessionData: Session) => {
    localStorage.setItem('quickbg_user', JSON.stringify(userData))
    localStorage.setItem('quickbg_session', JSON.stringify(sessionData))
    localStorage.setItem('quickbg_token', sessionData.token)
  }

  // 清除认证数据
  const clearAuthData = () => {
    localStorage.removeItem('quickbg_user')
    localStorage.removeItem('quickbg_session')
    localStorage.removeItem('quickbg_token')
  }

  // 登录
  const login = async (credentials: AuthCredentials): Promise<void> => {
    setIsLoading(true)
    try {
      // 这里应该调用实际的API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '登录失败')
      }

      const data = await response.json()
      
      setUser(data.user)
      setSession(data.session)
      saveAuthData(data.user, data.session)

      // 记住我选项
      if (credentials.rememberMe) {
        localStorage.setItem('quickbg_remember', 'true')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 注册
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '注册失败')
      }

      const result = await response.json()
      
      // 注册后自动登录
      if (result.autoLogin) {
        setUser(result.user)
        setSession(result.session)
        saveAuthData(result.user, result.session)
      }
    } catch (error) {
      console.error('Register error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 登出
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (session?.token) {
        // 调用API登出
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 无论如何都清除本地数据
      setUser(null)
      setSession(null)
      clearAuthData()
      setIsLoading(false)
    }
  }

  // 社交登录
  const socialLogin = async (auth: SocialAuth): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '社交登录失败')
      }

      const data = await response.json()
      
      setUser(data.user)
      setSession(data.session)
      saveAuthData(data.user, data.session)
    } catch (error) {
      console.error('Social login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 忘记密码
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '发送重置邮件失败')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  // 重置密码
  const resetPassword = async (data: PasswordReset): Promise<void> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '重置密码失败')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // 验证邮箱
  const verifyEmail = async (token: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '邮箱验证失败')
      }

      // 更新用户验证状态
      if (user) {
        setUser({ ...user, isVerified: true })
        localStorage.setItem('quickbg_user', JSON.stringify({ ...user, isVerified: true }))
      }
    } catch (error) {
      console.error('Verify email error:', error)
      throw error
    }
  }

  // 重新发送验证邮件
  const resendVerification = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '发送验证邮件失败')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      throw error
    }
  }

  // 更新个人资料
  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '更新个人资料失败')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      localStorage.setItem('quickbg_user', JSON.stringify(updatedUser))
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // 修改密码
  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '修改密码失败')
      }
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // 刷新会话
  const refreshSession = async (): Promise<void> => {
    if (!session?.refreshToken) return

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      })

      if (response.ok) {
        const newSession = await response.json()
        setSession(newSession)
        localStorage.setItem('quickbg_session', JSON.stringify(newSession))
        localStorage.setItem('quickbg_token', newSession.token)
      } else {
        // 刷新失败，登出
        await logout()
      }
    } catch (error) {
      console.error('Refresh session error:', error)
      // 刷新失败，登出
      await logout()
    }
  }

  // 定期刷新会话
  useEffect(() => {
    if (!session) return

    const expiresAt = new Date(session.expiresAt)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // 在过期前5分钟刷新
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)

    const refreshTimer = setTimeout(() => {
      refreshSession()
    }, refreshTime)

    return () => clearTimeout(refreshTimer)
  }, [session])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    register,
    logout,
    socialLogin,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    updateProfile,
    changePassword,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 自定义钩子
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 高阶组件：需要认证的页面
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WithAuth: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      // 重定向到登录页
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return null
    }

    return <Component {...props} />
  }

  WithAuth.displayName = `WithAuth(${Component.displayName || Component.name})`
  return WithAuth
}

// 高阶组件：不需要认证的页面（已登录用户重定向）
export const withoutAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WithoutAuth: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      )
    }

    if (isAuthenticated) {
      // 已登录用户重定向到首页
      window.location.href = '/'
      return null
    }

    return <Component {...props} />
  }

  WithoutAuth.displayName = `WithoutAuth(${Component.displayName || Component.name})`
  return WithoutAuth
}