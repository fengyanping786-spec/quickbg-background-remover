#!/bin/bash

# QuickBG 部署脚本
set -e

echo "🚀 开始部署 QuickBG..."

# 检查是否已登录 Cloudflare
if ! command -v wrangler &> /dev/null; then
    echo "❌ 请先安装 wrangler: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    echo "🔑 请先登录 Cloudflare: wrangler login"
    exit 1
fi

# 检查是否设置了 Remove.bg API 密钥
if [ -z "$REMOVE_BG_API_KEY" ]; then
    echo "🔑 请设置 Remove.bg API 密钥:"
    echo "export REMOVE_BG_API_KEY=your_api_key_here"
    echo "或运行: wrangler secret put REMOVE_BG_API_KEY"
    exit 1
fi

echo "📦 构建前端..."
cd frontend
npm run build

echo "🌐 部署前端到 Cloudflare Pages..."
wrangler pages deploy ./dist --project-name=quickbg

echo "⚙️ 部署 Worker..."
cd ../worker
wrangler deploy

echo "✅ 部署完成！"
echo "🌍 前端地址: https://quickbg.pages.dev"
echo "🔧 Worker 地址: https://bg-remover-worker.your-account.workers.dev"
echo ""
echo "📝 下一步:"
echo "1. 配置自定义域名（可选）"
echo "2. 设置监控和告警"
echo "3. 测试所有功能"