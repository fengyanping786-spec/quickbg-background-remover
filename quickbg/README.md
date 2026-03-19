# QuickBG - 快速图片背景去除工具

基于Cloudflare的无服务器图片背景去除工具，使用Remove.bg API，零存储成本。

## 🚀 快速开始

### 本地开发
```bash
# 前端开发
cd frontend
npm install
npm run dev

# Worker开发
cd worker
npm install
npm run dev
```

### 部署
```bash
# 部署Worker
cd worker
wrangler deploy

# 部署前端
cd frontend
npm run build
wrangler pages deploy ./dist
```

## 📁 项目结构
```
quickbg/
├── frontend/          # Cloudflare Pages前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── Uploader.tsx
│   │   │   ├── Preview.tsx
│   │   │   └── Download.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.js
│
└── worker/           # Cloudflare Worker后端
    ├── src/
    │   └── index.js  # API代理
    └── wrangler.toml
```

## 🛠️ 技术栈
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Cloudflare Workers + Remove.bg API
- **部署**: Cloudflare Pages + Workers
- **工具**: GitHub + Wrangler CLI

## 📋 功能特性
- ✅ 图片上传（拖拽/点击/URL粘贴）
- ✅ 格式支持：PNG/JPG/JPEG/WebP (≤10MB)
- ✅ 一键背景去除
- ✅ 实时预览对比
- ✅ 透明背景PNG下载
- ✅ 移动端适配

## 💰 成本控制
- **Remove.bg API**: 50张免费/月，之后$0.05/张
- **Cloudflare**: 免费额度内
- **月成本**: $0-50（完全可控）

## 📄 许可证
MIT License