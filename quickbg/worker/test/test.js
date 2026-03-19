/**
 * QuickBG Worker 测试
 * 
 * 这些测试用于验证Worker的基本功能
 */

// 模拟测试环境
const mockEnv = {
  REMOVE_BG_API_KEY: 'test-api-key-123'
}

// 模拟请求
function createMockRequest(method, path, body = null) {
  const url = `https://quickbg.example.com${path}`
  const requestInit = {
    method,
    headers: {}
  }

  if (body) {
    if (body instanceof FormData) {
      requestInit.body = body
    } else {
      requestInit.headers['Content-Type'] = 'application/json'
      requestInit.body = JSON.stringify(body)
    }
  }

  return new Request(url, requestInit)
}

// 测试健康检查端点
async function testHealthCheck() {
  console.log('测试健康检查端点...')
  
  const request = createMockRequest('GET', '/health')
  const response = await worker.fetch(request, mockEnv)
  
  if (response.status === 200) {
    const data = await response.json()
    console.log('✅ 健康检查通过:', data)
    return true
  } else {
    console.error('❌ 健康检查失败:', response.status)
    return false
  }
}

// 测试OPTIONS请求（CORS）
async function testOptionsRequest() {
  console.log('测试OPTIONS请求...')
  
  const request = createMockRequest('OPTIONS', '/remove-bg')
  const response = await worker.fetch(request, mockEnv)
  
  if (response.status === 200) {
    console.log('✅ OPTIONS请求通过')
    return true
  } else {
    console.error('❌ OPTIONS请求失败:', response.status)
    return false
  }
}

// 测试无效端点
async function testNotFound() {
  console.log('测试无效端点...')
  
  const request = createMockRequest('GET', '/invalid-endpoint')
  const response = await worker.fetch(request, mockEnv)
  
  if (response.status === 404) {
    console.log('✅ 404响应正确')
    return true
  } else {
    console.error('❌ 404响应失败:', response.status)
    return false
  }
}

// 测试方法不允许
async function testMethodNotAllowed() {
  console.log('测试方法不允许...')
  
  const request = createMockRequest('GET', '/remove-bg')
  const response = await worker.fetch(request, mockEnv)
  
  if (response.status === 405) {
    console.log('✅ 405响应正确')
    return true
  } else {
    console.error('❌ 405响应失败:', response.status)
    return false
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行QuickBG Worker测试...\n')
  
  const tests = [
    testHealthCheck,
    testOptionsRequest,
    testNotFound,
    testMethodNotAllowed
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message)
      failed++
    }
    console.log('')
  }
  
  console.log('📊 测试结果:')
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`📈 总计: ${tests.length}`)
  
  return failed === 0
}

// 注意：由于Worker需要实际环境运行，这些测试需要在Cloudflare Workers环境中执行
// 这里提供的是单元测试的框架

console.log('⚠️  注意：这些测试需要在Cloudflare Workers环境中运行')
console.log('运行命令: npm test 或直接在Workers环境中测试\n')

// 导出测试函数
module.exports = {
  runAllTests,
  testHealthCheck,
  testOptionsRequest,
  testNotFound,
  testMethodNotAllowed
}