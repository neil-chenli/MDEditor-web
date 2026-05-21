# MDEditor WebSite

MDEditor 官方网站 - 一个轻量级所见即所得的 Markdown 编辑器下载页面。

## 🌐 网站地址

https://mdeditor.neildata.com

## 📦 快速开始

### 安装 Git Hooks（首次使用必做）

```bash
node scripts/install-hooks.js
```

或双击运行 `scripts/install-hooks.bat`（Windows）

### 发布新版本

```bash
# 1. 复制安装包到 downloads 目录
cp MDEditor_1.0.504_x64-setup.exe downloads/

# 2. 提交（自动生成 version.json）
git add downloads/
git commit -m "发布 v1.0.504"

# 3. 推送
git push
```

就这么简单！version.json 会自动更新。

## 📚 完整文档

详细文档请查看 **[docs/](docs/README.md)** 目录：

- 📖 **[部署指南](docs/DEPLOYMENT_GUIDE.md)** - 完整的部署和发布流程
- 🔧 **[设置指南](docs/SETUP_GUIDE.md)** - 环境配置说明
- 🔄 **[同步配置指南](docs/SYNC_SETUP.md)** - 自动化同步方案

## 🎯 核心特性

### 自动版本管理

- ✅ 提交时自动生成 version.json
- ✅ 智能识别 Windows/macOS 平台
- ✅ 自动提取版本号
- ✅ 前端动态加载最新版本

### 平台识别规则

| 平台 | 文件扩展名 | 示例 |
|------|-----------|------|
| Windows | `.exe` | `MDEditor_1.0.504_x64-setup.exe` |
| macOS | `.dmg` | `MDEditor_1.0.504_aarch64.dmg` |

### 版本号格式

支持 `X.Y.Z` 格式，例如：
- `1.0.504`
- `v2.1.0`
- `1.0.499`

## 📁 项目结构

```
MDEditorWebSite/
├── docs/                        # 📚 文档目录
│   ├── README.md               # 文档索引
│   ├── DEPLOYMENT_GUIDE.md     # 部署指南
│   ├── SETUP_GUIDE.md          # 设置指南
│   └── SYNC_SETUP.md           # 同步配置指南
├── scripts/                     # 🔧 工具脚本
│   ├── generate-version.js     # 版本生成脚本
│   ├── install-hooks.js        # Hooks 安装脚本
│   └── install-hooks.bat       # Hooks 安装脚本 (Windows)
├── downloads/                   # 📦 安装包目录
│   ├── MDEditor_*_x64-setup.exe
│   └── MDEditor_*.dmg
├── version.json                 # ⚙️ 自动生成的版本配置
├── index.html                   # 🌐 网站主页
├── script.js                    # 💻 前端逻辑
└── styles.css                   # 🎨 样式文件
```

## 🛠️ 开发

### 本地测试

```bash
# 使用任意 HTTP 服务器
python -m http.server 8000
# 或
npx http-server -p 8000
```

然后访问 `http://localhost:8000`

### 手动生成版本文件

```bash
node scripts/generate-version.js
```

### 重新安装 Git Hooks

```bash
node scripts/install-hooks.js
```

## 🚀 部署

网站部署在 **Cloudflare Pages**，每次 `git push` 后自动部署。

### 部署流程

1. 推送代码到 GitHub
2. Cloudflare Pages 自动检测变化
3. 自动构建并部署（约 1-2 分钟）
4. CDN 全球分发

## ❓ 常见问题

### Git Hooks 不工作？

```bash
# 重新安装 hooks
node scripts/install-hooks.js

# 验证安装
ls -la .git/hooks/pre-commit*
```

### version.json 没有更新？

```bash
# 手动生成
node scripts/generate-version.js

# 查看结果
cat version.json
```

### 下载链接没有更新？

- 清除浏览器缓存：`Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac)
- 检查 version.json 是否已提交

更多问题请查看 **[完整故障排查指南](docs/DEPLOYMENT_GUIDE.md#故障排查)**

## 📝 最佳实践

1. **文件名规范**：始终包含版本号，如 `MDEditor_1.0.504_x64-setup.exe`
2. **提交信息**：清晰描述版本，如 `发布 v1.0.504`
3. **保留历史**：建议保留最近 3-5 个版本
4. **团队协作**：所有成员都需要安装 Git Hooks

## 🔗 相关链接

- **主项目**: https://github.com/neil-chenli/MDEditor
- **文档中心**: [docs/README.md](docs/README.md)
- **部署指南**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## 📄 许可证

MIT License

---

**💡 提示**：换电脑或重装系统后，记得运行 `node scripts/install-hooks.js` 重新配置 Git Hooks！
