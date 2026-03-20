# QuickBG API 文档

## 📖 概述

QuickBG API 提供图片背景去除服务，基于 Cloudflare Workers 和 Remove.bg API 构建。

## 🌐 基础信息

### 端点
- 生产环境: `https://api.quickbg.ai`
- 开发环境: `http://localhost:8787`
- 预发布环境: `https://staging.quickbg-worker.*.workers.dev`

### 认证
目前API无需认证，但有限制：
- 频率限制: 60请求/分钟/IP
- 文件大小: 最大10MB
- 格式限制: PNG, JPG, JPEG, WebP

## 📊 API 端点

### 健康检查
检查API服务状态。

**请求**
```http
GET /health
```

**响应**
```json
{
  "status": "ok",
  "service": "QuickBG Background Remover",
  "version": "1.0.0",
  "timestamp": "2026-03-20T08:18:00.000Z"
}
```

### 去除背景
去除图片背景并返回透明背景图片。

**请求**
```http
POST /remove-bg
Content-Type: multipart/form-data
```

**参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| image | File | 是 | 图片文件 |

**示例 (cURL)**
```bash
curl -X POST https://api.quickbg.ai/remove-bg \
  -F "image=@/path/to/your/image.png"
```

**成功响应**
- 状态码: `200 OK`
- Content-Type: `image/png`
- Headers:
  ```
  Content-Disposition: attachment; filename="background-removed.png"
  X-Processing-Time: 1234
  ```

**错误响应**
```json
{
  "success": false,
  "error": "错误描述",
  "timestamp": "2026-03-20T08:18:00.000Z"
}
```

**状态码**
| 状态码 | 说明 |
|--------|------|
| 200 | 处理成功，返回图片 |
| 400 | 请求参数错误 |
| 413 | 文件太大 |
| 415 | 不支持的图片格式 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

## 🔧 高级功能

### 处理选项（计划中）
未来版本将支持以下选项：
```http
POST /remove-bg
Content-Type: multipart/form-data

image=@file.png
format=jpg
quality=85
remove_shadow=true
enhance_edges=false
auto_crop=true
```

## ⚡ 性能指标

### 处理时间
- 小图片(≤1MB): 1-3秒
- 中图片(1-5MB): 3-8秒  
- 大图片(5-10MB): 8-15秒

### 成功率
- 标准图片: >95%
- 复杂背景: >85%
- 低质量图片: >70%

## 🛡️ 安全考虑

### CORS 配置
```javascript
Access-Control-Allow-Origin: "*"
Access-Control-Allow-Methods: "GET, POST, OPTIONS"
Access-Control-Allow-Headers: "Content-Type, Authorization"
```

### 输入验证
- 文件类型验证
- 文件大小限制
- MIME类型检查
- 恶意内容检测

### 速率限制
```javascript
// 基于IP的速率限制
限制: 60请求/分钟
窗口: 滑动窗口
惩罚: 5分钟冷却
```

## 📈 监控指标

### 业务指标
- 请求总数
- 成功/失败率
- 平均处理时间
- 文件大小分布

### 系统指标
- Worker 内存使用
- CPU 时间
- 错误率
- 响应时间

### 可用性
- 正常运行时间: >99.9%
- 平均响应时间: <2秒
- 错误率: <1%

## 🔌 客户端集成

### JavaScript/TypeScript
```typescript
import { removeBackground } from './api/client'

async function processImage(file: File) {
  try {
    const result = await removeBackground(file)
    if (result.success) {
      // 处理成功
      const imageUrl = result.data.imageUrl
    } else {
      // 处理失败
      console.error(result.error)
    }
  } catch (error) {
    // 网络错误
    console.error('Network error:', error)
  }
}
```

### Python
```python
import requests

def remove_background(image_path):
    url = "https://api.quickbg.ai/remove-bg"
    
    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        # 保存处理后的图片
        with open('output.png', 'wb') as f:
            f.write(response.content)
        return True
    else:
        print(f"Error: {response.status_code}")
        return False
```

### Node.js
```javascript
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

async function removeBackground(imagePath) {
  const form = new FormData()
  form.append('image', fs.createReadStream(imagePath))
  
  try {
    const response = await axios.post('https://api.quickbg.ai/remove-bg', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer'
    })
    
    fs.writeFileSync('output.png', response.data)
    console.log('Background removed successfully')
  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
  }
}
```

## 🐛 故障排除

### 常见问题

#### Q: 收到 413 错误
A: 图片文件太大，请压缩到10MB以内。

#### Q: 收到 415 错误  
A: 不支持的图片格式，请使用PNG、JPG或WebP格式。

#### Q: 处理时间过长
A: 大图片或复杂背景需要更长时间，请耐心等待。

#### Q: 返回的图片质量差
A: 尝试调整质量参数或使用更高分辨率的原图。

#### Q: 主体识别不准确
A: 确保图片主体清晰，背景与主体对比明显。

### 调试信息
请求时添加调试头：
```http
X-Debug: true
```

响应将包含额外信息：
```json
{
  "success": false,
  "error": "Invalid image format",
  "debug": {
    "fileSize": 5242880,
    "fileType": "image/gif",
    "timestamp": "2026-03-20T08:18:00.000Z",
    "requestId": "req_abc123"
  }
}
```

## 📞 支持

### 问题报告
- GitHub Issues: [https://github.com/yourusername/quickbg/issues](https://github.com/yourusername/quickbg/issues)
- 邮箱: api-support@quickbg.ai

### SLA 保证
- 响应时间: 99% < 5秒
- 可用性: 99.9% 每月
- 支持响应: 24小时内

### 版本策略
- 主版本: 重大变更，可能不向后兼容
- 次版本: 新功能，向后兼容
- 修订版本: Bug修复，向后兼容

## 🔄 更新日志

### v1.0.0 (2026-03-20)
- 初始API版本
- 基础图片处理功能
- 健康检查端点
- 完整错误处理

### 计划功能
- [ ] 批量处理支持
- [ ] 处理选项参数
- [ ] Webhook 回调
- [ ] 实时进度通知
- [ ] 结果缓存

---

**最后更新**: 2026年3月20日  
**API版本**: 1.0.0  
**文档版本**: 1.0.0