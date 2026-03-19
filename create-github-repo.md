# GitHub 仓库创建指南

由于 GitHub CLI 需要交互式登录，请按照以下步骤手动创建仓库：

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `quickbg`
   - **Description**: `Quick Background Remover - Serverless image background removal tool`
   - **Visibility**: Public (推荐) 或 Private
   - **Initialize this repository with**: 不要勾选任何选项
   - **Add .gitignore**: 选择 Node
   - **Add a license**: 选择 MIT License

3. 点击 "Create repository"

## 步骤 2: 添加远程仓库到本地

创建仓库后，GitHub 会显示以下命令：

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/quickbg.git

# 推送代码
git push -u origin master
```

## 步骤 3: 推送代码

运行上述命令将本地代码推送到 GitHub。

## 步骤 4: 设置 GitHub Actions (可选)

仓库创建后，可以设置 GitHub Actions 来自动化部署：

1. 在仓库页面点击 "Actions"
2. 选择 "Node.js" 工作流模板
3. 修改 `.github/workflows/node.js.yml` 文件
4. 提交更改

## 步骤 5: 配置 Secrets

在 GitHub 仓库设置中配置以下 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：
   - `REMOVE_BG_API_KEY`: Remove.bg API 密钥
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID

## 替代方案：使用 GitHub CLI

如果你已经登录了 GitHub CLI，可以运行：

```bash
# 创建仓库
gh repo create quickbg --public --description "Quick Background Remover" --source=. --remote=origin --push

# 或手动创建后推送
gh repo create quickbg --public --description "Quick Background Remover" --remote=origin
git push -u origin master
```

## 项目文件说明

已创建的项目文件：

1. **规划文档**:
   - `MVP执行摘要.md` - 项目概述和技术架构
   - `MVP需求文档.md` - 详细需求规格
   - `开发任务清单.md` - 3周开发计划

2. **项目结构**:
   - `quickbg/` - 主项目目录
   - `quickbg/README.md` - 项目说明
   - `quickbg/package.json` - 根包配置
   - `quickbg/deploy.sh` - 部署脚本
   - `quickbg/frontend/` - 前端项目目录
   - `quickbg/worker/` - Worker 项目目录

3. **Git 配置**:
   - `.gitignore` - Git 忽略文件
   - 已提交初始 commit

## 下一步

1. 完成 GitHub 仓库创建
2. 开始第 1 周开发工作：
   - 创建前端项目（React + TypeScript + Vite）
   - 创建 Worker 项目（Cloudflare Worker）
   - 开发核心组件