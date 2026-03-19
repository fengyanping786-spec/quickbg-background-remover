/**
 * QuickBG Worker - 图片背景去除API
 * 基于Cloudflare Workers和Remove.bg API
 */

// CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
async function handleRemoveBg(request, env) {
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
 * 健康检查端点
 */
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'QuickBG Background Remover',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
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
 * 主请求处理函数
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request)
    }

    // 路由处理
    switch (path) {
      case '/':
      case '/health':
        return handleHealthCheck()

      case '/remove-bg':
        if (request.method === 'POST') {
          return handleRemoveBg(request, env)
        }
        return new Response('Method not allowed', { status: 405 })

      default:
        return new Response('Not found', { status: 404 })
    }
  },
}