#!/bin/bash

# 直接创建GitHub仓库脚本
set -e

echo "🚀 直接创建GitHub仓库"
echo "========================================"

# 仓库信息
USERNAME="fengyanping786-spec"
REPO_NAME="quickbg-background-remover"
DESCRIPTION="Quick Background Remover - Serverless image background removal tool"
VISIBILITY="public"  # 或 "private"

echo "📋 仓库信息:"
echo "  - 所有者: $USERNAME"
echo "  - 仓库名: $REPO_NAME"
echo "  - 描述: $DESCRIPTION"
echo "  - 可见性: $VISIBILITY"
echo ""

# 检查本地Git仓库
echo "📊 检查本地Git仓库..."
if [ ! -d ".git" ]; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

git status
echo ""

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 当前分支: $CURRENT_BRANCH"
echo ""

# 显示提交历史
echo "📝 提交历史:"
git log --oneline -6
echo ""

# 检查仓库是否已存在
echo "🔍 检查仓库是否已存在..."
if curl -s "https://api.github.com/repos/$USERNAME/$REPO_NAME" | grep -q '"message":"Not Found"'; then
    echo "✅ 仓库不存在，可以创建"
else
    echo "⚠️  仓库可能已存在"
fi
echo ""

echo "📋 手动创建步骤:"
echo ""
echo "1. 访问 https://github.com/new"
echo "2. 填写信息:"
echo "   - Owner: $USERNAME"
echo "   - Repository name: $REPO_NAME"
echo "   - Description: $DESCRIPTION"
echo "   - Visibility: $VISIBILITY"
echo "   - 不要初始化 README、.gitignore 或 license"
echo ""
echo "3. 创建后运行以下命令:"
echo ""
echo "   # 添加远程仓库"
echo "   git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
echo ""
echo "   # 推送代码"
echo "   git push -u origin $CURRENT_BRANCH"
echo ""
echo "4. 验证:"
echo "   git remote -v"
echo "   git log --oneline"
echo ""

echo "🔧 如果已有GitHub Token，可以运行:"
echo ""
echo "   # 设置Token"
echo "   export GH_TOKEN=your_github_token"
echo ""
echo "   # 创建仓库"
echo "   gh repo create $REPO_NAME --$VISIBILITY --description \"$DESCRIPTION\" --remote=origin --push"
echo ""

echo "🌍 仓库URL: https://github.com/$USERNAME/$REPO_NAME"
echo ""

echo "📁 将推送的文件:"
echo "   - quickbg/ (完整项目结构)"
echo "   - MVP执行摘要.md"
echo "   - MVP需求文档.md"
echo "   - 开发任务清单.md"
echo "   - setup-github.sh"
echo "   - GITHUB_SETUP.md"
echo "   - .gitignore"
echo ""

echo "✅ 准备就绪，等待创建远程仓库..."