# QuickBG 用户指南

## 📖 简介

QuickBG 是一个基于 Cloudflare 的无服务器图片背景去除工具，使用 Remove.bg API 提供快速、简单、免费的图片背景去除服务。

## 🚀 快速开始

### 1. 访问网站
打开 [https://quickbg.ai](https://quickbg.ai) 或您部署的域名。

### 2. 上传图片
- **拖拽上传**: 将图片拖拽到上传区域
- **点击上传**: 点击上传区域选择图片
- **URL上传**: 输入图片URL地址（开发中）

### 3. 去除背景
点击"一键去除背景"按钮，AI将自动识别并去除图片背景。

### 4. 下载结果
处理完成后，下载透明背景的PNG图片。

## 📱 功能特性

### 图片格式支持
- ✅ PNG
- ✅ JPG/JPEG  
- ✅ WebP
- ❌ GIF（暂不支持）

### 文件大小限制
- 最大文件大小: 10MB
- 推荐尺寸: 1920×1080 以内
- 自动压缩: 1MB以上图片自动压缩

### 处理选项
- **输出格式**: PNG、JPG
- **图片质量**: 50%-100%
- **阴影去除**: 自动识别并去除阴影
- **边缘增强**: 优化主体边缘
- **自动裁剪**: 自动裁剪透明区域

## 🎨 界面功能

### 主界面区域
1. **上传区域**: 图片上传和预览
2. **操作按钮**: 去除背景、清除图片
3. **预览区域**: 原图和处理结果对比
4. **下载区域**: 处理结果下载选项

### 设置面板
点击右下角齿轮图标打开设置：
- **处理设置**: 格式、质量、功能开关
- **界面设置**: 主题、语言、动画速度
- **高级设置**: API端点、调试模式、历史记录

### 历史记录
点击右下角时钟图标查看历史记录：
- 自动保存处理记录
- 点击记录可重新加载
- 支持批量删除

## ⚡ 性能优化

### 图片压缩
- 1MB以上图片自动压缩
- 保持原始图片质量
- 显示压缩节省空间

### 加载优化
- 骨架屏加载效果
- 图片懒加载
- 离线支持

### 移动端优化
- 响应式设计
- 触摸优化
- 手势提示

## 🔧 高级功能

### API 使用
开发者可以通过以下API端点使用服务：

```bash
# 健康检查
GET /health

# 去除背景
POST /remove-bg
Content-Type: multipart/form-data
Body: image=@your-image.png
```

### 环境变量
```bash
# 前端环境变量
VITE_API_URL=https://api.quickbg.ai

# Worker环境变量  
REMOVE_BG_API_KEY=your_remove_bg_api_key
```

## 🛡️ 隐私与安全

### 数据保护
- 图片处理在内存中进行
- 不存储用户图片
- 不收集个人信息
- 加密传输

### 使用限制
- 免费版: 50张/月
- 处理时间: 2-10秒/张
- 并发限制: 3个并发处理

## ❓ 常见问题

### Q: 处理失败怎么办？
A: 检查图片格式和大小，确保网络连接正常，或尝试刷新页面。

### Q: 支持批量处理吗？
A: 目前仅支持单张图片处理，批量处理功能开发中。

### Q: 处理后的图片会保存多久？
A: 图片仅在当前会话中保存，关闭页面后自动清除。

### Q: 如何获取更多处理次数？
A: 联系管理员或升级到付费版本。

### Q: 支持自定义API密钥吗？
A: 企业版支持自定义Remove.bg API密钥。

## 📞 技术支持

### 问题反馈
- GitHub Issues: [https://github.com/yourusername/quickbg/issues](https://github.com/yourusername/quickbg/issues)
- 邮箱: support@quickbg.ai

### 文档资源
- API文档: [https://quickbg.ai/docs/api](https://quickbg.ai/docs/api)
- 部署指南: [https://quickbg.ai/docs/deploy](https://quickbg.ai/docs/deploy)
- 开发指南: [https://quickbg.ai/docs/dev](https://quickbg.ai/docs/dev)

## 📄 许可证

MIT License - 详见 [LICENSE](https://github.com/yourusername/quickbg/blob/main/LICENSE) 文件。

## 🔄 更新日志

### v1.0.0 (2026-03-20)
- 初始版本发布
- 基础图片上传和处理功能
- 移动端适配和性能优化
- 错误处理和监控系统

---

**最后更新**: 2026年3月20日  
**版本**: 1.0.0