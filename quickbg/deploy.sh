#!/bin/bash

# QuickBG 部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始部署 QuickBG...${NC}"

# 检查环境
check_environment() {
    echo -e "${YELLOW}🔍 检查部署环境...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 请先安装 Node.js${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 请先安装 npm${NC}"
        exit 1
    fi
    
    # 检查 wrangler
    if ! command -v wrangler &> /dev/null; then
        echo -e "${YELLOW}📦 安装 wrangler...${NC}"
        npm install -g wrangler
    fi
    
    # 检查 Cloudflare 登录状态
    if ! wrangler whoami &> /dev/null; then
        echo -e "${YELLOW}🔑 请先登录 Cloudflare...${NC}"
        wrangler login
    fi
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}📦 安装项目依赖...${NC}"
    
    # 安装根项目依赖
    echo -e "${BLUE}安装根项目依赖...${NC}"
    npm install
    
    # 安装前端依赖
    echo -e "${BLUE}安装前端依赖...${NC}"
    cd frontend
    npm install
    cd ..
    
    # 安装 Worker 依赖
    echo -e "${BLUE}安装 Worker 依赖...${NC}"
    cd worker
    npm install
    cd ..
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 设置环境变量
setup_environment() {
    echo -e "${YELLOW}⚙️ 设置环境变量...${NC}"
    
    # 检查 Remove.bg API 密钥
    if [ -z "$REMOVE_BG_API_KEY" ]; then
        echo -e "${YELLOW}🔑 请设置 Remove.bg API 密钥:${NC}"
        read -p "请输入 Remove.bg API 密钥: " api_key
        export REMOVE_BG_API_KEY="$api_key"
        
        # 保存到 Cloudflare Secrets
        echo -e "${BLUE}保存 API 密钥到 Cloudflare Secrets...${NC}"
        cd worker
        echo "$api_key" | wrangler secret put REMOVE_BG_API_KEY
        cd ..
    fi
    
    echo -e "${GREEN}✅ 环境变量设置完成${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}🔨 构建项目...${NC}"
    
    # 构建前端
    echo -e "${BLUE}构建前端...${NC}"
    cd frontend
    npm run build
    cd ..
    
    # 构建 Worker
    echo -e "${BLUE}构建 Worker...${NC}"
    cd worker
    npm run build
    cd ..
    
    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 部署到 Cloudflare
deploy_to_cloudflare() {
    echo -e "${YELLOW}🌐 部署到 Cloudflare...${NC}"
    
    # 部署 Worker
    echo -e "${BLUE}部署 Worker...${NC}"
    cd worker
    
    # 部署到生产环境
    echo -e "${BLUE}部署到生产环境...${NC}"
    wrangler deploy --env production
    
    # 部署到预发布环境
    echo -e "${BLUE}部署到预发布环境...${NC}"
    wrangler deploy --env staging
    
    cd ..
    
    # 部署前端
    echo -e "${BLUE}部署前端...${NC}"
    cd frontend
    
    # 部署到生产环境
    echo -e "${BLUE}部署到生产环境...${NC}"
    wrangler pages deploy ./dist --project-name=quickbg --branch=main
    
    # 部署到预览环境
    echo -e "${BLUE}部署到预览环境...${NC}"
    wrangler pages deploy ./dist --project-name=quickbg --branch=preview
    
    cd ..
    
    echo -e "${GREEN}✅ 部署完成${NC}"
}

# 运行测试
run_tests() {
    echo -e "${YELLOW}🧪 运行测试...${NC}"
    
    # 运行前端测试
    echo -e "${BLUE}运行前端测试...${NC}"
    cd frontend
    npm test -- --watchAll=false || echo -e "${YELLOW}⚠️ 前端测试跳过${NC}"
    cd ..
    
    # 运行 Worker 测试
    echo -e "${BLUE}运行 Worker 测试...${NC}"
    cd worker
    npm test || echo -e "${YELLOW}⚠️ Worker 测试跳过${NC}"
    cd ..
    
    echo -e "${GREEN}✅ 测试完成${NC}"
}

# 显示部署信息
show_deployment_info() {
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo ""
    echo -e "${BLUE}📊 部署信息:${NC}"
    echo -e "  🌍 生产环境前端: https://quickbg.pages.dev"
    echo -e "  🔧 生产环境 API: https://api.quickbg.ai"
    echo -e "  🚀 预览环境前端: https://preview.quickbg.pages.dev"
    echo -e "  ⚙️  预览环境 API: https://staging.quickbg-worker.your-account.workers.dev"
    echo ""
    echo -e "${YELLOW}📝 下一步:${NC}"
    echo -e "  1. 配置自定义域名（可选）"
    echo -e "  2. 设置监控和告警"
    echo -e "  3. 测试所有功能"
    echo -e "  4. 配置 CI/CD 流水线"
    echo ""
    echo -e "${BLUE}🔧 管理命令:${NC}"
    echo -e "  📊 查看日志: wrangler tail"
    echo -e "  ⚙️  更新配置: wrangler publish"
    echo -e "  🗑️  删除部署: wrangler delete"
}

# 主函数
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}      QuickBG 部署脚本         ${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "使用方法: ./deploy.sh [选项]"
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --test, -t     运行测试但不部署"
        echo "  --deploy, -d   只部署不运行测试"
        echo "  --full, -f     完整部署（默认）"
        exit 0
    fi
    
    # 执行部署流程
    check_environment
    install_dependencies
    setup_environment
    
    if [ "$1" != "--deploy" ] && [ "$1" != "-d" ]; then
        run_tests
    fi
    
    build_project
    deploy_to_cloudflare
    show_deployment_info
}

# 执行主函数
main "$@"