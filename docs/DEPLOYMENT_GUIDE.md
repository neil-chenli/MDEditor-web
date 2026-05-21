# MDEditor 网站部署指南

## 📋 概述

本指南介绍如何部署和维护 MDEditor 官方网站，包括自动版本管理系统的配置和使用。

---

## 🚀 快速开始

### 首次配置

1. **克隆仓库**
   ```bash
   git clone https://github.com/neil-chenli/MDEditor-web.git
   cd MDEditorWebSite
   ```

2. **安装 Git Hooks**（重要！）
   
   Git Hooks 用于在提交时自动生成 `version.json`，无需手动维护版本信息。
   
   **Windows 用户：**
   ```bash
   node scripts/install-hooks.js
   ```
   或双击运行 `scripts/install-hooks.bat`

   **Mac/Linux 用户：**
   ```bash
   node scripts/install-hooks.js
   ```

   成功后会看到：
   ```
   ✅ Git Hooks 安装成功!
   ```

3. **验证配置**
   ```bash
   ls -la .git/hooks/pre-commit
   ```

---

## 📦 发布新版本

### 标准流程（推荐）

1. **准备安装包**
   - 将新版本的安装包放入 `downloads/` 目录
   - **文件名必须包含版本号**，例如：
     - `MDEditor_1.0.503_x64-setup.exe` (Windows)
     - `MDEditor_1.0.503_aarch64.dmg` (macOS)

2. **提交代码**
   ```bash
   git add downloads/
   git commit -m "发布 v1.0.503"
   ```
   
   **此时会自动触发：**
   - ✅ 扫描 `downloads/` 目录
   - ✅ 识别最新版本号
   - ✅ 生成/更新 `version.json`
   - ✅ 自动将 `version.json` 添加到提交

   你会看到类似输出：
   ```
   🔄 Generating version.json...
   ✓ version.json generated successfully!
     Latest Windows: MDEditor_1.0.503_x64-setup.exe
     Latest macOS: MDEditor_1.0.502_aarch64.dmg
     Version: 1.0.503
   ✓ version.json staged for commit
   ```

3. **推送到 GitHub**
   ```bash
   git push
   ```

4. **等待自动部署**
   - Cloudflare Pages 会自动检测代码变化
   - 大约 1-2 分钟后网站更新完成

### 示例：完整发布流程

```bash
# 1. 复制新版本的安装包到 downloads 目录
cp ../MDEditor/build/MDEditor_1.0.504_x64-setup.exe downloads/

# 2. 添加到 Git
git add downloads/MDEditor_1.0.504_x64-setup.exe

# 3. 提交（自动生成 version.json）
git commit -m "发布 v1.0.504"

# 4. 推送
git push origin main
```

---

## 🔧 自动版本管理系统

### 工作原理

```
┌─────────────────────┐
│  提交代码到 Git     │
│  (git commit)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  pre-commit hook    │
│  自动触发           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  scripts/           │
│  generate-version.js│
│  扫描 downloads/    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  生成 version.json  │
│  - 识别平台         │
│  - 提取版本号       │
│  - 选择最新版本     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  自动添加到提交     │
│  (git add)          │
└─────────────────────┘
```

### 平台识别规则

系统自动根据文件名识别平台：

| 平台 | 识别规则 | 示例 |
|------|---------|------|
| **Windows** | 文件名包含 `.exe` 或 `win` | `MDEditor_1.0.503_x64-setup.exe` |
| **macOS** | 文件名包含 `.dmg` 或 `mac` | `MDEditor_1.0.503_aarch64.dmg` |

### 版本号提取规则

支持以下格式（使用正则表达式 `v?(\d+\.\d+\.\d+)`）：

- ✅ `MDEditor_1.0.503_x64-setup.exe` → `1.0.503`
- ✅ `MDEditor-v1.0.504-win.exe` → `1.0.504`
- ✅ `MDEditor_2.1.0_mac.dmg` → `2.1.0`

---

## 📁 文件结构

```
MDEditorWebSite/
├── .git/
│   └── hooks/
│       ├── pre-commit          # Git Hook (Unix/Linux/Mac)
│       └── pre-commit.bat      # Git Hook (Windows)
├── scripts/
│   ├── generate-version.js     # 版本生成脚本
│   ├── install-hooks.js        # Hooks 安装脚本
│   └── install-hooks.bat       # Hooks 安装脚本 (Windows)
├── downloads/
│   ├── MDEditor_1.0.503_x64-setup.exe   # Windows 安装包
│   └── MDEditor_1.0.502_aarch64.dmg     # macOS 安装包
├── version.json                 # 自动生成的版本配置文件
├── index.html                   # 网站主页
├── script.js                    # 前端逻辑（动态加载 version.json）
└── styles.css                   # 样式文件
```

---

## 🛠️ 手动操作

### 手动生成 version.json

如果需要手动生成版本文件：

```bash
node scripts/generate-version.js
```

输出示例：
```
✓ version.json generated successfully!
  Latest Windows: MDEditor_1.0.503_x64-setup.exe
  Latest macOS: MDEditor_1.0.502_aarch64.dmg
  Version: 1.0.503
```

### 重新安装 Git Hooks

如果 hooks 丢失或损坏：

```bash
node scripts/install-hooks.js
```

### 查看当前版本配置

```bash
cat version.json
```

---

## 🌐 部署到 Cloudflare Pages

### 自动部署（推荐）

1. 在 Cloudflare Pages 中连接 GitHub 仓库
2. 配置构建设置：
   - **Production branch**: `main`
   - **Build command**: （留空，纯静态网站）
   - **Build output directory**: `/`
3. 启用自动部署

每次 `git push` 后，Cloudflare Pages 会自动：
- 检测代码变化
- 部署新版本
- 更新 CDN 缓存

### 手动部署

```bash
# 使用 Wrangler CLI
wrangler pages deploy . --project-name=mdeditor
```

---

## ❓ 故障排查

### 1. Git Hook 没有自动运行？

**检查：**
```bash
# 验证 hooks 是否存在
ls -la .git/hooks/pre-commit*

# 验证 hooks 是否有执行权限（Mac/Linux）
chmod +x .git/hooks/pre-commit
```

**重新安装：**
```bash
node scripts/install-hooks.js
```

### 2. version.json 没有自动更新？

**检查提交日志：**
```bash
git log --oneline -5
```

查看是否有 "Generating version.json" 相关输出。

**手动生成并检查：**
```bash
node scripts/generate-version.js
cat version.json
```

### 3. 下载链接没有更新？

**清除浏览器缓存：**
- Windows: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**检查 version.json 是否已提交：**
```bash
git log version.json
```

**验证前端是否正常加载：**
打开浏览器开发者工具，查看 Network 标签，确认 `version.json` 成功加载（状态码 200）。

### 4. 平台识别错误？

确保文件名符合规范：
- Windows: 包含 `.exe` 或 `win`
- macOS: 包含 `.dmg` 或 `mac`

**示例：**
- ✅ `MDEditor_1.0.503_x64-setup.exe`
- ✅ `MDEditor_1.0.503_aarch64.dmg`
- ❌ `setup.exe` (缺少版本号)
- ❌ `MDEditor.exe` (缺少版本号)

### 5. 版本号识别错误？

确保文件名包含 `X.Y.Z` 格式的版本号：
- ✅ `MDEditor_1.0.503_x64-setup.exe`
- ✅ `MDEditor-v2.1.0-win.exe`
- ❌ `MDEditor_latest.exe`

---

## 📝 最佳实践

1. **文件名规范**
   - 始终包含版本号：`MDEditor_X.Y.Z_platform.ext`
   - 使用语义化版本号：`主版本。次版本。修订号`

2. **提交信息**
   - 清晰描述版本变化：`发布 v1.0.503`
   - 可以使用约定式提交：`feat: 发布 v1.0.503`

3. **保留历史版本**
   - 建议保留最近 3-5 个版本
   - 旧版本可以归档或删除

4. **定期更新 Hooks**
   - 换电脑或重装系统后，记得运行 `node scripts/install-hooks.js`
   - 团队成员也需要安装 hooks

---

## 🔗 相关文档

- [设置指南](SETUP_GUIDE.md) - 详细的项目设置说明
- [同步配置指南](SYNC_SETUP.md) - 从 MDEditor 仓库自动同步安装包

---

## 💡 技术支持

如有问题，请：
1. 查看本指南的故障排查部分
2. 检查 GitHub Actions 日志
3. 联系项目维护者
