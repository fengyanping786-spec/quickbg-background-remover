# QuickBG 开发指南

## 项目结构

```
quickbg/
├── frontend/              # React前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   │   ├── Uploader.tsx      # 图片上传组件
│   │   │   ├── Preview.tsx       # 图片预览组件
│   │   │   └── DownloadButton.tsx # 下载组件
│   │   ├── App.tsx      # 主应用组件
│   │   ├── main.tsx     # 应用入口
│   │   └── index.css    # 全局样式
│   ├── index.html       # HTML模板
│   ├── package.json     # 前端依赖
│   └── vite.config.js   # 构建配置
│
├── worker/              # Cloudflare Worker后端
│   ├── src/
│   │   └── index.js     # Worker主逻辑
│   ├── test/
│   │   └── test.js      # 测试文件
│   ├── package.json     # Worker依赖
│   └── wrangler.toml    # Worker配置
│
├── package.json         # 根项目配置
├── deploy.sh           # 部署脚本
└── README-DEV.md       # 开发指南
```

## 开发环境设置

### 1. 安装依赖

```bash
# 安装根项目依赖
npm install

# 安装前端依赖
cd frontend
npm install

# 安装Worker依赖
cd ../worker
npm install
```

### 2. 启动开发服务器

#### 前端开发
```bash
cd frontend
npm run dev
```
前端将在 http://localhost:3000 启动

#### Worker开发
```bash
cd worker
npm run dev
```
Worker将在 http://localhost:8787 启动

### 3. 同时启动前后端
```bash
# 在根目录运行
npm run dev
```

## 组件说明

### 前端组件

#### 1. Uploader组件 (`components/Uploader.tsx`)
- 图片上传功能（拖拽 + 点击）
- 支持PNG、JPG、JPEG、WebP格式
- 文件大小验证（≤10MB）
- 图片预览

#### 2. Preview组件 (`components/Preview.tsx`)
- 原图和处理后图片对比显示
- 处理状态指示
- 透明背景网格显示

#### 3. DownloadButton组件 (`components/DownloadButton.tsx`)
- 图片下载功能
- 格式选择（PNG/JPG）
- 质量调整
- 链接复制和分享

### Worker API

#### 端点
- `GET /health` - 健康检查
- `POST /remove-bg` - 图片背景去除
- 自动处理CORS

#### 功能
- 图片验证（格式、大小）
- Remove.bg API集成
- 错误处理
- 安全验证

## 开发工作流

### 第1周：基础功能开发 ✅
- [x] 项目结构创建
- [x] 前端组件开发
- [x] Worker API开发
- [x] GitHub仓库创建

### 第2周：体验优化
- [ ] UI/UX优化
- [ ] 移动端适配
- [ ] 加载状态优化
- [ ] 错误处理完善

### 第3周：部署上线
- [ ] Cloudflare部署
- [ ] 性能优化
- [ ] 监控配置
- [ ] 文档完善

## API集成

### Remove.bg API配置
1. 注册Remove.bg账户
2. 获取API密钥
3. 配置到Cloudflare Secrets:
```bash
cd worker
wrangler secret put REMOVE_BG_API_KEY
```

### 环境变量
```bash
# 前端环境变量
VITE_API_URL=http://localhost:8787

# Worker环境变量
REMOVE_BG_API_KEY=your_remove_bg_api_key
```

## 测试

### 前端测试
```bash
cd frontend
npm test
```

### Worker测试
```bash
cd worker
npm test
```

## 部署

### 开发部署
```bash
# 部署Worker
cd worker
npm run deploy

# 部署前端
cd ../frontend
npm run build
npm run deploy
```

### 生产部署
使用根目录的部署脚本：
```bash
./deploy.sh
```

## 开发注意事项

1. **图片处理**: 所有图片处理在内存中进行，不存储用户图片
2. **API限制**: Remove.bg API有调用限制，注意监控使用量
3. **错误处理**: 前端和Worker都需要完善的错误处理
4. **性能优化**: 图片压缩、懒加载、缓存策略
5. **安全性**: 输入验证、API密钥保护、CORS配置

## 故障排除

### 常见问题

1. **前端无法启动**
   - 检查Node.js版本（需要≥18）
   - 清除node_modules重新安装
   - 检查端口占用

2. **Worker开发服务器错误**
   - 检查wrangler配置
   - 验证API密钥
   - 查看控制台日志

3. **API调用失败**
   - 检查网络连接
   - 验证API密钥
   - 查看Remove.bg账户状态

### 日志查看
```bash
# 前端日志
cd frontend && npm run dev

# Worker日志
cd worker && wrangler dev
```

## 贡献指南

1. Fork仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License