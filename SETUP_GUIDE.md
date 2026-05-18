# 自动同步安装包 - 完整设置指南

## 概述

本指南将帮助你配置从 `neil-chenli/MDEditor` 仓库自动同步安装包到 `neil-chenli/MDEditor-web` 网站仓库。

---

## 前置条件

- 你是两个仓库的拥有者或有写入权限
- MDEditor 仓库使用 GitHub Actions 构建，并且构建产物在 Artifacts 中

---

## 完整设置步骤

### 第一步：创建 Personal Access Token (PAT)

1. 访问：https://github.com/settings/tokens
2. 点击 **Generate new token** 按钮
3. 选择 **Generate new token (classic)**
4. 填写信息：
   - **Note**: `MDEditor Web Sync Token`
   - **Expiration**: 选择 `No expiration`（或选择你需要的有效期）
   - **Select scopes**: 勾选 **repo**（点击 `repo` 这一行，会自动勾选所有子项）
5. 点击 **Generate token** 按钮
6. **重要**：立即复制生成的 token（格式类似 `ghp_xxxxx...`），保存到安全的地方，只显示一次！

---

### 第二步：在 MDEditor 仓库添加 Secret

1. 访问：https://github.com/neil-chenli/MDEditor/settings/secrets/actions
2. 点击 **New repository secret** 按钮
3. 填写信息：
   - **Name**: `SITE_REPO_TOKEN`
   - **Value**: 粘贴刚才复制的 token
4. 点击 **Add secret**

---

### 第三步：创建同步工作流文件

1. 访问：https://github.com/neil-chenli/MDEditor
2. 点击 **Add file** 按钮，选择 **Create new file**
3. 在 **Name your file...** 输入框中，完整填写路径：
   ```
   .github/workflows/sync-to-site.yml
   ```
4. 在下方的大编辑区中，完整复制粘贴以下代码：

```yaml
name: Sync to Website

on:
  workflow_run:
    workflows: ["Build Tauri App"]
    types:
      - completed
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    if: |
      (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success') ||
      (github.event_name == 'workflow_dispatch')
    
    steps:
    - name: Checkout Website repo
      uses: actions/checkout@v4
      with:
        repository: neil-chenli/MDEditor-web
        path: site-repo
        token: ${{ secrets.SITE_REPO_TOKEN }}
        
    - name: Download artifacts from latest successful run
      uses: dawidd6/action-download-artifact@v3
      with:
        workflow: "Build Tauri App"
        workflow_conclusion: success
        path: artifacts
        repo: neil-chenli/MDEditor
        
    - name: Copy artifacts to downloads directory
      run: |
        shopt -s nullglob
        
        echo "Artifacts directory contents:"
        ls -lh artifacts/
        
        for f in artifacts/**/*.exe; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        for f in artifacts/**/*.dmg; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        for f in artifacts/*.exe; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        for f in artifacts/*.dmg; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        echo "Downloads directory after copy:"
        ls -lh site-repo/downloads/
        
    - name: Commit and push to Website repo
      working-directory: site-repo
      run: |
        git config --local user.email "github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        
        git add downloads/
        
        if git diff --staged --quiet; then
          echo "No changes to commit"
        else
          git commit -m "chore: sync new release artifacts from CI"
          git push
        fi
```

5. 滚动到页面底部，点击 **Commit changes** 按钮
6. 点击 **Commit changes** 确认

---

## 工作原理

### 自动同步流程

1. 在 `neil-chenli/MDEditor` 仓库推送代码或发布版本
2. "Build Tauri App" workflow 运行并生成安装包 artifacts
3. 构建成功完成后，自动触发 "Sync to Website" workflow
4. 下载最新构建的 artifacts（`.exe` 和 `.dmg`）
5. 复制到网站仓库的 `downloads/` 目录
6. 自动提交并推送到网站仓库
7. 网站仓库的 "Update Version Info" workflow 自动更新 `version.json`
8. Cloudflare Pages 自动部署，网站显示最新下载链接

### 手动同步

如果需要手动同步：
1. 访问：https://github.com/neil-chenli/MDEditor/actions/workflows/sync-to-site.yml
2. 点击 **Run workflow**
3. 选择 **main** 分支，点击绿色 **Run workflow** 按钮

---

## 网站仓库已有的配置

你的 `neil-chenli/MDEditor-web` 仓库已经配置好了：

1. ✅ `update-version.yml` - 自动更新 `version.json` 的工作流
2. ✅ `script.js` - 自动读取 `version.json` 并更新下载链接和版本信息
3. ✅ `styles.css` - 样式支持
4. ✅ `index.html` - 页面布局已更新

---

## 验证配置

配置完成后，你可以：

1. **触发一次构建**：在 MDEditor 仓库推送一次代码，观察 Actions
2. **检查同步**：构建成功后，查看网站仓库的 `downloads/` 目录是否有新文件
3. **访问网站**：打开 https://mdeditor-web.pages.dev/ 检查下载链接是否更新

---

## 故障排查

### 问题：同步工作流没有触发

- 检查工作流文件名是否正确：`.github/workflows/sync-to-site.yml`
- 检查 Secret `SITE_REPO_TOKEN` 是否已正确添加
- 检查 `workflows` 名称是否匹配：`"Build Tauri App"`

### 问题：文件没有复制成功

- 检查 Artifacts 中的文件名格式，确保包含 `.exe` 或 `.dmg`
- 查看 Actions 日志，看复制步骤的输出

### 问题：网站没有更新

- 检查网站仓库的 `downloads/` 目录是否有新文件
- 检查 `version.json` 是否更新
- 检查 Cloudflare Pages 部署状态

---

## 相关文档

- [SYNC_SETUP.md](./SYNC_SETUP.md) - 两种方案的详细对比
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 原始部署指南
