/**
 * QuickBG Worker - 图片背景去除API（带用户认证）
 * 基于Cloudflare Workers和Remove.bg API
 */

// CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
}

// 用户存储（使用Cloudflare KV）
let usersKV
let sessionsKV
let historyKV

/**
 * 初始化KV存储
 */
function initKV(env) {
  usersKV = env.USERS
  sessionsKV = env.SESSIONS
  historyKV = env.HISTORY
}

/**
 * 处理OPTIONS请求（CORS预检）
 */
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders,
  })
}

/**
 * 验证JWT令牌
 */
async function verifyToken(token) {
  try {
    // 这里应该使用实际的JWT验证
    // 暂时使用简单的KV查找
    const sessionData = await sessionsKV.get(token)
    if (!sessionData) {
      return null
    }

    const session = JSON.parse(sessionData)
    
    // 检查会话是否过期
    if (new Date(session.expiresAt) < new Date()) {
      await sessionsKV.delete(token)
      return null
    }

    return session
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * 验证API密钥
 */
async function verifyApiKey(apiKey) {
  try {
    // 这里应该验证API密钥
    // 暂时返回模拟数据
    return {
      userId: 'user_' + apiKey.substring(0, 8),
      permissions: ['process_images', 'view_history']
    }
  } catch (error) {
    console.error('API key verification error:', error)
    return null
  }
}

/**
 * 验证认证
 */
async function authenticateRequest(request) {
  const authHeader = request.headers.get('Authorization')
  const apiKeyHeader = request.headers.get('X-API-Key')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const session = await verifyToken(token)
    if (session) {
      return { type: 'user', data: session }
    }
  }

  if (apiKeyHeader) {
    const apiKeyData = await verifyApiKey(apiKeyHeader)
    if (apiKeyData) {
      return { type: 'api', data: apiKeyData }
    }
  }

  return null
}

/**
 * 验证图片文件
 */
function validateImageFile(file) {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error('不支持的图片格式。请上传PNG、JPG或WebP格式的图片。')
  }

  if (file.size > maxSize) {
    throw new Error('图片大小不能超过10MB。')
  }

  return true
}

/**
 * 调用Remove.bg API去除背景
 */
async function removeBackground(imageBuffer, apiKey) {
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: 'application/octet-stream' })
  formData.append('image_file', blob, 'image.png')
  formData.append('size', 'auto')
  formData.append('format', 'png')

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Remove.bg API错误: ${response.status} - ${errorText}`)
  }

  return await response.arrayBuffer()
}

/**
 * 处理图片上传和背景去除
 */
async function handleRemoveBg(request, env, auth) {
  try {
    // 检查API密钥
    if (!env.REMOVE_BG_API_KEY) {
      throw new Error('Remove.bg API密钥未配置')
    }

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('image')

    if (!file) {
      throw new Error('未找到图片文件')
    }

    // 验证文件
    validateImageFile(file)

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()

    // 调用Remove.bg API
    const processedImage = await removeBackground(arrayBuffer, env.REMOVE_BG_API_KEY)

    // 记录处理历史（如果已认证）
    if (auth) {
      await recordProcessingHistory(auth, file, processedImage.length)
    }

    // 返回处理后的图片
    return new Response(processedImage, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="background-removed.png"',
        'X-Processing-Time': Date.now().toString(),
      },
    })

  } catch (error) {
    console.error('背景去除失败:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '处理失败',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

/**
 * 记录处理历史
 */
async function recordProcessingHistory(auth, file, processedSize) {
  try {
    if (!historyKV || auth.type !== 'user') return

    const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const historyData = {
      id: historyId,
      userId: auth.data.userId,
      originalImage: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      processedImage: {
        size: processedSize,
        format: 'png',
      },
      processingTime: Date.now(),
      status: 'success',
      createdAt: new Date().toISOString(),
    }

    await historyKV.put(historyId, JSON.stringify(historyData))
    
    // 同时存储到用户的历史列表
    const userHistoryKey = `user_history_${auth.data.userId}`
    const existingHistory = await historyKV.get(userHistoryKey)
    let historyList = []
    
    if (existingHistory) {
      historyList = JSON.parse(existingHistory)
    }
    
    historyList.unshift({
      id: historyId,
      timestamp: Date.now(),
      fileName: file.name,
      fileSize: file.size,
      status: 'success'
    })
    
    // 只保留最近的100条记录
    if (historyList.length > 100) {
      historyList = historyList.slice(0, 100)
    }
    
    await historyKV.put(userHistoryKey, JSON.stringify(historyList))
  } catch (error) {
    console.error('记录处理历史失败:', error)
  }
}

/**
 * 健康检查端点
 */
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'QuickBG Background Remover',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      features: ['background-removal', 'user-auth', 'history-tracking']
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * 用户注册
 */
async function handleRegister(request) {
  try {
    const data = await request.json()
    const { email, password, name } = data

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱和密码是必填项'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 检查用户是否已存在
    const userKey = `user_email_${email}`
    const existingUser = await usersKV.get(userKey)
    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '该邮箱已被注册'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 创建用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 创建用户数据
    const userData = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false,
      isActive: true,
      settings: {
        theme: 'auto',
        language: 'zh',
        notification: {
          email: true,
          push: false,
          processingComplete: true,
          monthlyReport: false
        },
        privacy: {
          saveHistory: true,
          shareAnalytics: true,
          autoDeleteHistory: 30
        }
      }
    }

    // 存储用户数据
    await usersKV.put(userKey, JSON.stringify(userData))
    await usersKV.put(`user_id_${userId}`, JSON.stringify(userData))

    // 创建会话
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
    const sessionData = {
      id: sessionId,
      userId,
      token: sessionId,
      refreshToken: `refresh_${Math.random().toString(36).substr(2, 16)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
      userAgent: request.headers.get('User-Agent') || '',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    }

    await sessionsKV.put(sessionId, JSON.stringify(sessionData))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userData,
          session: sessionData,
          autoLogin: true
        },
        message: '注册成功'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('注册错误:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '注册失败，请稍后重试'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 用户登录
 */
async function handleLogin(request) {
  try {
    const data = await request.json()
    const { email, password, rememberMe } = data

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱和密码是必填项'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 查找用户
    const userKey = `user_email_${email}`
    const userDataStr = await usersKV.get(userKey)
    
    if (!userDataStr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱或密码错误'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = JSON.parse(userDataStr)

    // 这里应该验证密码（暂时跳过）
    // 实际项目中应该使用bcrypt等库进行密码哈希验证

    // 创建会话
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
    const sessionData = {
      id: sessionId,
      userId: userData.id,
      token: sessionId,
      refreshToken: `refresh_${Math.random().toString(36).substr(2, 16)}`,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString(),
      userAgent: request.headers.get('User-Agent') || '',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    }

    await sessionsKV.put(sessionId, JSON.stringify(sessionData))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userData,
          session: sessionData
        },
        message: '登录成功'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('登录错误:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '登录失败，请稍后重试'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 获取当前用户信息
 */
async function handleGetCurrentUser(auth) {
  try {
    if (auth.type !== 'user') {
      return new Response(
        JSON.stringify({
          success: false,
          error: '需要用户认证'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userDataStr = await usersKV.get(`user_id_${auth.data.userId}`)
    if (!userDataStr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '用户不存在'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = JSON.parse(userDataStr)
    
    // 更新最后活动时间
    const sessionDataStr = await sessionsKV.get(auth.data.token)
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr)
      sessionData.lastActivityAt = new Date().toISOString()
      await sessionsKV.put(auth.data.token, JSON.stringify(sessionData))
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: userData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '获取用户信息失败'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 获取处理历史
 */
async function handleGetHistory(auth, url) {
  try {
    if (auth.type !== 'user') {
      return new Response(
        JSON.stringify({
          success: false,
          error: '需要用户认证'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const searchParams = new URL(url).searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const userHistoryKey = `user_history_${auth.data.userId}`
    const historyListStr = await historyKV.get(userHistoryKey)
    
    let historyList = []
    if (historyListStr) {
      historyList = JSON.parse(historyListStr)
    }

    // 过滤历史记录
    let filteredHistory = historyList
    
    if (startDate) {
      const startTimestamp = new Date(startDate).getTime()
      filteredHistory = filteredHistory.filter(item => item.timestamp >= startTimestamp)
    }
    
    if (endDate) {
      const endTimestamp = new Date(endDate).getTime()
      filteredHistory = filteredHistory.filter(item => item.timestamp <= endTimestamp)
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex)

    // 获取详细历史数据
    const detailedHistory = []
    for (const item of paginatedHistory) {
      const historyDetailStr = await historyKV.get(item.id)
      if (historyDetailStr) {
        detailedHistory.push(JSON.parse(historyDetailStr))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          items: detailedHistory,
          total: filteredHistory.length,
          page,
          limit,
          hasMore: endIndex < filteredHistory.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('获取历史记录错误:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '获取历史记录失败'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 主请求处理函数
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // 初始化KV存储
    initKV(env)

    // 处理OPTIONS请求
    if (