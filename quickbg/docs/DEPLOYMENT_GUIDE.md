# QuickBG 部署指南

## 📖 概述

本指南介绍如何部署 QuickBG 到 Cloudflare 平台。

## 🎯 部署目标

- 前端: Cloudflare Pages
- 后端: Cloudflare Workers
- 域名: 自定义域名（可选）
- 监控: Cloudflare Analytics

## 📋 前提条件

### 必要工具
- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 必要账户
- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
- [Remove.bg 账户](https://www.remove.bg/)（获取API密钥）

### 环境变量
```bash
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Remove.bg
REMOVE_BG_API_KEY=your_remove_bg_api_key
```

## 🚀 快速部署

### 1. 一键部署脚本
```bash
# 克隆仓库
git clone https://github.com/yourusername/quickbg.git
cd quickbg

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 2. 手动部署步骤

#### 步骤1: 安装依赖
```bash
# 安装项目依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..

# 安装Worker依赖
cd worker
npm install
cd ..
```

#### 步骤2: 配置环境变量
```bash
# 设置Remove.bg API密钥
cd worker
wrangler secret put REMOVE_BG_API_KEY
# 输入您的API密钥
cd ..
```

#### 步骤3: 构建项目
```bash
# 构建前端
cd frontend
npm run build
cd ..

# 构建Worker
cd worker
npm run build
cd ..
```

#### 步骤4: 部署到Cloudflare
```bash
# 部署Worker
cd worker
wrangler deploy
cd ..

# 部署前端
cd frontend
wrangler pages deploy ./dist --project-name=quickbg
cd ..
```

## 🔧 环境配置

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 前端: http://localhost:3000
# Worker: http://localhost:8787
```

### 生产环境
```bash
# 构建生产版本
npm run build

# 部署到生产环境
./deploy.sh --deploy
```

### 预发布环境
```bash
# 部署到预发布环境
cd worker
wrangler deploy --env staging
cd ../frontend
wrangler pages deploy ./dist --project-name=quickbg --branch=preview
```

## 🌐 域名配置

### 自定义域名
1. 在 Cloudflare DNS 添加记录
2. 在 Pages 设置中绑定域名
3. 在 Workers 设置中绑定域名
4. 配置SSL证书（自动）

### 示例配置
```
# DNS 记录
quickbg.ai          A       192.0.2.1
api.quickbg.ai      CNAME   quickbg-worker.your-account.workers.dev
www.quickbg.ai      CNAME   quickbg.pages.dev
```

### SSL/TLS 配置
- 边缘证书: 自动颁发
- 最小TLS版本: TLS 1.2
- HSTS: 启用
- 始终使用HTTPS: 启用

## 📊 监控配置

### Cloudflare Analytics
1. 启用 Pages Analytics
2. 启用 Workers Analytics
3. 配置 Web Analytics

### 错误监控
1. 配置 Sentry（可选）
2. 启用 Workers 错误日志
3. 设置告警规则

### 性能监控
```bash
# 查看Worker日志
wrangler tail

# 查看Pages分析
wrangler pages project list
```

## 🔒 安全配置

### 安全头
已配置的安全头：
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: 严格策略

### 速率限制
```toml
# wrangler.toml
[limits]
cpu_ms = 10000
memory = 128
```

### 访问控制
```bash
# 设置 Workers 路由访问限制
wrangler route list
wrangler route add "api.quickbg.ai/*"
```

## ⚡ 性能优化

### 前端优化
- 图片懒加载
- 代码分割
- 缓存策略
- 服务端渲染（可选）

### Worker 优化
- 内存缓存
- 连接复用
- 响应压缩
- 边缘计算

### CDN 配置
- 缓存静态资源
- 启用 Brotli 压缩
- 配置缓存规则
- 启用 Argo Smart Routing

## 🔄 CI/CD 配置

### GitHub Actions
已配置的流水线：
1. **测试**: 代码检查、单元测试
2. **构建**: 生产环境构建
3. **部署**: 自动部署到Cloudflare
4. **通知**: 部署状态通知

### 手动触发
```bash
# 部署生产环境
./deploy.sh --deploy

# 完整部署（包含测试）
./deploy.sh --full

# 只运行测试
./deploy.sh --test
```

### 环境变量管理
```bash
# 设置 Secrets
wrangler secret put REMOVE_BG_API_KEY

# 查看环境变量
wrangler secret list

# 删除环境变量
wrangler secret delete REMOVE_BG_API_KEY
```

## 🐛 故障排除

### 常见问题

#### Q: 部署失败，显示认证错误
A: 确保已登录 Wrangler：
```bash
wrangler login
wrangler whoami
```

#### Q: Worker 部署成功但无法访问
A: 检查路由配置：
```bash
wrangler route list
```

#### Q: 前端部署后显示空白页面
A: 检查构建输出和路由配置：
```bash
# 检查构建文件
ls -la frontend/dist/

# 检查路由配置
cat frontend/_routes.json
```

#### Q: API 返回 500 错误
A: 检查 Worker 日志：
```bash
wrangler tail
```

#### Q: 图片处理失败
A: 检查 Remove.bg API 密钥：
```bash
wrangler secret list
```

### 调试模式
```bash
# 启用调试日志
WRANGLER_LOG=debug wrangler deploy

# 查看详细日志
wrangler tail --format=pretty
```

### 回滚部署
```bash
# 回滚 Worker
wrangler deployments list
wrangler rollback --version=<version>

# 回滚 Pages
wrangler pages deployment list --project-name=quickbg
wrangler pages deployment rollback --project-name=quickbg --deployment-id=<id>
```

## 📈 扩展部署

### 多区域部署
```toml
# wrangler.toml
[placement]
mode = "smart"
```

### 数据库集成
```bash
# 使用 D1 数据库
wrangler d1 create quickbg-db
```

### 对象存储
```bash
# 使用 R2 存储
wrangler r2 bucket create quickbg-images
```

### 消息队列
```bash
# 使用 Queues
wrangler queues create quickbg-queue
```

## 🏗️ 架构图

```
用户请求 → Cloudflare DNS → Cloudflare CDN
                             ↓
                      Cloudflare Pages (前端)
                             ↓
                    Cloudflare Workers (API)
                             ↓
                       Remove.bg API
                             ↓
                       返回处理结果
```

## 📞 支持

### 部署问题
- 查看 [Cloudflare 文档](https://developers.cloudflare.com/)
- 提交 [GitHub Issue](https://github.com/yourusername/quickbg/issues)
- 加入 [Discord 社区](https://discord.gg/your-community)

### 监控告警
- 配置 Pages 告警
- 配置 Workers 告警
- 设置 Uptime Robot（可选）

### 备份策略
- 定期备份代码
- 导出环境变量
- 保存部署配置

## 🔄 更新维护

### 日常维护
```bash
# 更新依赖
npm update

# 安全审计
npm audit

# 清理构建缓存
npm run clean
```

### 版本升级
```bash
# 检查更新
npm outdated

# 更新版本
npm update --save

# 测试新版本
npm test
```

### 数据迁移
```bash
# 备份数据
wrangler d1 export quickbg-db --output=backup.sql

# 恢复数据
wrangler d1 execute quickbg-db --file=backup.sql
```

---

**最后更新**: 2026年3月20日  
**部署版本**: 1.0.0  
**适用环境**: 生产、预发布、开发