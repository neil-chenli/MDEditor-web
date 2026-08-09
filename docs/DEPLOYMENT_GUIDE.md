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

1. **修改新版官网**
   - 页面文件只修改 `site/` 目录中的 `index.html`、`script.js` 和 `styles.css`
   - 不要再修改或新增根目录的旧版页面文件

2. **准备安装包（发布新版本时）**
   - 将新版本的安装包放入 `downloads/` 目录
   - **文件名必须包含版本号**，例如：
     - `MDEditor_1.0.503_x64-setup.exe` (Windows)
     - `MDEditor_1.0.503_aarch64.dmg` (macOS)

3. **提交代码**
   ```bash
   git add site/ downloads/
   git commit -m "更新官网或发布 v1.0.503"
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

4. **推送到 GitHub**
   ```bash
   git push origin main
   ```

5. **等待自动部署**
   - Cloudflare Pages 自动构建并发布 `site/`、`version.json` 和 `downloads/`
   - GitHub Actions 自动将同样的内容部署到阿里云 ECS
   - 两个网址都会更新：
     - `https://md.shuyu.com`
     - `https://mdeditor-web.pages.dev/`
   - 可在 GitHub Actions 查看 ECS 部署状态

### 示例：完整发布流程

```bash
# 1. 修改 site/ 中的官网文件，或复制新安装包到 downloads/
cp ../MDEditor/build/MDEditor_1.0.504_x64-setup.exe downloads/

# 2. 添加修改
git add site/ downloads/

# 3. 提交（自动生成 version.json）
git commit -m "更新官网或发布 v1.0.504"

# 4. 推送，触发两个网站自动部署
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
├── .github/
│   └── workflows/
│       └── deploy-site.yml      # ECS 自动部署工作流
├── site/                        # 唯一的新版官网源码
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── scripts/
│   ├── generate-version.js      # 版本生成脚本
│   ├── install-hooks.js         # Hooks 安装脚本
│   └── install-hooks.bat        # Hooks 安装脚本 (Windows)
├── downloads/                   # Windows/macOS 安装包
├── version.json                 # 自动生成的版本配置文件
└── docs/                        # 项目文档
```

`site/` 是唯一需要修改的官网页面目录。根目录的 `index.html`、`styles.css` 和 `script.js` 是供 Cloudflare Pages 发布的同步副本，禁止手动编辑；每次发布前由 `site/` 覆盖同步。

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

## 🌐 双站自动部署

两个网址显示同一套新版页面：

- 阿里云正式站：`https://md.shuyu.com`
- Cloudflare Pages：`https://mdeditor-web.pages.dev/`

唯一页面源码位于 `site/`。发布时，两个平台都使用以下内容：

```text
site/index.html
site/styles.css
site/script.js
version.json
downloads/
```

### Cloudflare Pages 配置

在 Cloudflare Pages 项目的 **Settings → Builds & deployments** 中配置：

- **Production branch**：`main`
- **Root directory**：保持仓库根目录（留空）
- **Build command**：
  ```bash
  rm -rf dist && mkdir -p dist/downloads && cp site/index.html site/styles.css site/script.js dist/ && cp version.json dist/ && cp -r downloads/. dist/downloads/
  ```
- **Build output directory**：`dist`

每次 `git push origin main` 后，Cloudflare Pages 会自动构建并发布 `dist/`。

### 阿里云 ECS 配置

ECS 由 GitHub Actions 工作流自动部署：

```text
.github/workflows/deploy-site.yml
```

工作流会通过 SSH 将 `site/`、`version.json` 和 `downloads/` 上传到 ECS，并执行服务器上的部署脚本。部署状态可在 GitHub 仓库的 **Actions** 页面查看。

### HTTPS

正式站使用 Let's Encrypt 证书：

```text
https://md.shuyu.com
```

证书由 Certbot 自动续期。服务器需要在阿里云安全组放行 TCP `80` 和 `443`。

### 手动部署

```bash
# Cloudflare Pages
npx wrangler pages deploy dist --project-name=mdeditor

# ECS 不建议手动上传，优先通过 git push 触发 GitHub Actions
```

---

## ❓ 故障排查

### 1. GitHub Actions 部署失败？

先打开 GitHub 仓库的 **Actions** 页面，进入失败的 `部署新版官网到 ECS` 工作流，查看失败步骤。

如果日志包含：

```text
Host key verification failed
No ED25519 host key is known
```

在 ECS 上重新获取主机指纹：

```bash
ssh-keyscan -H -t ed25519 120.77.146.67
```

只将输出中以 `|1|` 开头、并包含 `ssh-ed25519` 的完整一行更新到 GitHub Secret：

```text
ECS_KNOWN_HOSTS
```

不要使用以 `#` 开头的 SSH 服务版本提示行，也不要提交或公开 `ECS_SSH_KEY`。

确认以下 GitHub Secrets 存在：

```text
ECS_HOST
ECS_USER
ECS_SSH_KEY
ECS_KNOWN_HOSTS
```

修正后可在失败运行页面选择 **Re-run jobs → Re-run failed jobs**。

### 2. Git Hook 没有自动运行？

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
