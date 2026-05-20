# 自动同步安装包配置指南

## 概述

本配置可以在 `neil-chenli/MDEditor` 仓库每次发布新版本时，自动将构建产物同步到 `neil-chenli/MDEditor-web` 网站的 `downloads` 目录。

---

## 方案选择

### 方案 A：安装包在仓库目录中（简单）
适用于安装包直接提交到仓库的情况。

### 方案 B：从 Actions artifacts 下载（推荐）
适用于安装包是 CI/CD 构建产物的情况。

---

## 第一步：在 MDEditor 仓库配置

### 1. 创建 Personal Access Token (PAT)

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置以下内容：
   - Note: `MDEditor Web Sync Token`
   - Expiration: 选择 `No expiration`（或者你希望的有效期）
   - Scopes: 勾选 `repo`（完整仓库访问权限）
4. 点击 "Generate token"
5. **重要**：立即复制这个 token（只显示一次）

### 2. 在 MDEditor 仓库添加 Secret

1. 访问 https://github.com/neil-chenli/MDEditor/settings/secrets/actions
2. 点击 "New repository secret"
3. Name: `SITE_REPO_TOKEN`
4. Value: 粘贴刚才复制的 token
5. 点击 "Add secret"

---

## 第二步：选择方案并配置

### 方案 B：从 Actions artifacts 下载（推荐）

在 `neil-chenli/MDEditor` 仓库中创建文件 `.github/workflows/sync-to-site.yml`：

```yaml
name: Sync to Website

on:
  workflow_run:
    workflows: ["*"]  # 监听所有 workflow 完成
    types:
      - completed
  workflow_dispatch:      # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
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
        workflow: ${{ github.event.workflow_run.workflow_id }}
        run_id: ${{ github.event.workflow_run.id }}
        path: artifacts
        repo: neil-chenli/MDEditor
        
    - name: Copy artifacts to downloads directory
      run: |
        shopt -s nullglob
        
        echo "Artifacts directory contents:"
        ls -lh artifacts/
        
        # 查找并复制所有 exe 和 dmg 文件
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
        
        # 如果 artifacts 目录没找到，直接在 artifacts/ 根目录查找
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
        
        # 检查是否有变更
        if git diff --staged --quiet; then
          echo "No changes to commit"
        else
          git commit -m "chore: sync new release artifacts from CI"
          git push
        fi
```

---

### 方案 A：安装包在仓库目录中（简单）

如果安装包直接在仓库目录中，使用这个工作流：

```yaml
name: Sync to Website

on:
  push:
    branches: [ main, master ]
    paths:
      - '**/*.exe'
      - '**/*.dmg'
      - '**/*.json'       # package.json 等
      - '**/*.yml'        # 构建配置
      - '**/*.yaml'
  release:
    types: [ published ]
  workflow_dispatch:      # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout MDEditor
      uses: actions/checkout@v4
      
    - name: Checkout Website repo
      uses: actions/checkout@v4
      with:
        repository: neil-chenli/MDEditor-web
        path: site-repo
        token: ${{ secrets.SITE_REPO_TOKEN }}
        
    - name: Find and copy build artifacts
      run: |
        # 在 MDEditor 仓库中查找所有构建产物
        shopt -s nullglob
        
        # 查找 Windows 安装包
        WINDOWS_FILES=(*.exe MDEditor*-setup.exe MDEditor*Windows*.exe MDEditor*win*.exe)
        
        # 查找 macOS 安装包
        MAC_FILES=(*.dmg MDEditor*Mac*.dmg MDEditor*mac*.dmg)
        
        # 复制到网站目录
        for f in "${WINDOWS_FILES[@]}"; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        for f in "${MAC_FILES[@]}"; do
          if [ -f "$f" ]; then
            cp "$f" "site-repo/downloads/"
            echo "Copied: $f"
          fi
        done
        
        # 如果根目录没找到，在 dist/ 或 release/ 目录查找
        if [ -d "dist" ]; then
          cp -n dist/*.exe "site-repo/downloads/" 2>/dev/null || true
          cp -n dist/*.dmg "site-repo/downloads/" 2>/dev/null || true
        fi
        
        if [ -d "release" ]; then
          cp -n release/*.exe "site-repo/downloads/" 2>/dev/null || true
          cp -n release/*.dmg "site-repo/downloads/" 2>/dev/null || true
        fi
        
        # 显示下载目录内容
        echo "Downloads directory after copy:"
        ls -lh site-repo/downloads/
        
    - name: Commit and push to Website repo
      working-directory: site-repo
      run: |
        git config --local user.email "github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        
        git add downloads/
        
        # 检查是否有变更
        if git diff --staged --quiet; then
          echo "No changes to commit"
        else
          git commit -m "chore: sync new release artifacts"
          git push
        fi
```

---

## 第三步：工作流程

1. 在 `neil-chenli/MDEditor` 仓库构建新版本
2. 推送代码或发布 Release
3. GitHub Actions 自动触发
4. 自动将 `.exe` 和 `.dmg` 文件复制到 `MDEditor-web` 的 `downloads/` 目录
5. 自动提交并推送
6. Cloudflare Pages 自动部署更新
7. 网站的 Actions 自动更新 `version.json`

---

## 手动触发

如果需要手动同步：
1. 访问 https://github.com/neil-chenli/MDEditor/actions/workflows/sync-to-site.yml
2. 点击 "Run workflow"
3. 选择分支，点击 "Run workflow"
