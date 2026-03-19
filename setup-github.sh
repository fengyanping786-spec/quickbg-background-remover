#!/bin/bash

# QuickBG GitHub 仓库设置脚本
set -e

echo "🚀 QuickBG GitHub 仓库设置脚本"
echo "========================================"

# 检查 Git 状态
echo "📊 检查 Git 状态..."
if [ ! -d ".git" ]; then
    echo "❌ 当前目录不是 Git 仓库"
    exit 1
fi

git status
echo ""

# 检查 GitHub CLI
echo "🔧 检查 GitHub CLI..."
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安装"
    echo "请安装: https://cli.github.com/"
    exit 1
fi

# 检查认证状态
echo "🔐 检查 GitHub 认证状态..."
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI 未认证"
    echo ""
    echo "请运行以下命令进行认证:"
    echo "gh auth login"
    echo ""
    echo "或者设置环境变量:"
    echo "export GH_TOKEN=your_github_token"
    exit 1
fi

echo "✅ GitHub CLI 已认证"
echo ""

# 获取用户信息
echo "👤 获取 GitHub 用户信息..."
USERNAME=$(gh api user --jq .login)
echo "当前用户: $USERNAME"
echo ""

# 创建仓库
echo "📦 创建 GitHub 仓库..."
read -p "请输入仓库名称 (默认: quickbg): " REPO_NAME
REPO_NAME=${REPO_NAME:-quickbg}

read -p "请输入仓库描述 (默认: Quick Background Remover): " REPO_DESC
REPO_DESC=${REPO_DESC:-"Quick Background Remover - Serverless image background removal tool"}

read -p "仓库可见性 (public/private, 默认: public): " VISIBILITY
VISIBILITY=${VISIBILITY:-public}

echo ""
echo "即将创建仓库:"
echo "  - 名称: $REPO_NAME"
echo "  - 描述: $REPO_DESC"
echo "  - 可见性: $VISIBILITY"
echo "  - 所有者: $USERNAME"
echo ""

read -p "是否继续? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ 操作取消"
    exit 0
fi

# 创建仓库
echo "🔄 创建仓库..."
gh repo create "$REPO_NAME" --"$VISIBILITY" --description "$REPO_DESC" --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo "✅ 仓库创建成功!"
    echo ""
    echo "🌍 仓库地址: https://github.com/$USERNAME/$REPO_NAME"
    echo ""
    
    # 显示当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    echo "📌 当前分支: $CURRENT_BRANCH"
    echo ""
    
    # 显示提交历史
    echo "📝 最近提交:"
    git log --oneline -5
    echo ""
    
    echo "🎉 设置完成!"
    echo ""
    echo "下一步:"
    echo "1. 访问 https://github.com/$USERNAME/$REPO_NAME"
    echo "2. 配置 GitHub Actions (可选)"
    echo "3. 设置 Secrets:"
    echo "   - REMOVE_BG_API_KEY"
    echo "   - CLOUDFLARE_API_TOKEN"
    echo "4. 开始开发!"
    
else
    echo "❌ 仓库创建失败"
    echo ""
    echo "手动步骤:"
    echo "1. 访问 https://github.com/new"
    echo "2. 创建仓库: $REPO_NAME"
    echo "3. 运行以下命令:"
    echo "   git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
    echo "   git push -u origin $CURRENT_BRANCH"
    exit 1
fi