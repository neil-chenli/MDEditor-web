# 自动下载链接更新系统

## 功能说明

本系统实现了下载链接的自动化管理，当你发布新版本时，无需手动修改 HTML 中的下载链接。

### 实现原理

1. **GitHub Actions 自动扫描**：当 `downloads/` 目录有文件变化时，自动扫描并生成 `version.json`
2. **前端动态加载**：页面加载时读取 `version.json`，自动更新下载按钮和版本信息

### 文件结构

```
MDEditorWebSite/
├── .github/
│   └── workflows/
│       └── update-version.yml    # GitHub Actions 工作流
├── downloads/
│   ├── MDEditor_Win_Setup.exe   # Windows 安装包
│   └── MDEditor_Mac.dmg         # macOS 安装包
├── version.json                 # 自动生成的版本配置文件
├── index.html
├── script.js                    # 读取 version.json 并更新页面
└── styles.css
```

## 版本配置文件 (version.json)

自动生成的配置文件格式如下：

```json
{
  "generatedAt": "2026-05-17T23:35:40.573Z",
  "latestVersion": "1.0.40",
  "releaseDate": "2026-05-17",
  "files": [
    {
      "filename": "MDEditor_1.0.40_x64-setup.exe",
      "version": "1.0.40",
      "platform": "windows",
      "size": 5430419,
      "modified": "2026-05-17T23:13:56.488Z"
    }
  ],
  "downloads": {
    "windows": "MDEditor_1.0.40_x64-setup.exe",
    "macos": "MDEditor_1.0.32_aarch64.dmg"
  }
}
```

## 用户操作流程

### 发布新版本

1. **准备安装包**
   - 将新版本的安装包放到 `downloads/` 目录
   - 建议文件名包含版本号，例如：
     - `MDEditor_1.0.41_x64-setup.exe` (Windows)
     - `MDEditor_1.0.41_aarch64.dmg` (macOS)

2. **提交代码**
   ```bash
   git add downloads/
   git commit -m "发布 v1.0.41 版本"
   git push
   ```

3. **等待自动处理**
   - GitHub Actions 会自动运行，扫描 `downloads/` 目录
   - 自动更新 `version.json` 并提交到仓库
   - Cloudflare Pages 自动部署新的网站

4. **完成！**
   - 访问你的网站，下载按钮已自动指向最新版本

### 平台识别规则

系统会根据以下规则自动识别文件所属平台：

- **Windows**: 文件名包含 `.exe` 或 `win`（不区分大小写）
- **macOS**: 文件名包含 `.dmg` 或 `mac`（不区分大小写）

### 版本号识别规则

系统会自动从文件名中提取版本号，支持以下格式：
- `MDEditor_1.0.40_x64-setup.exe` → `1.0.40`
- `MDEditor-v1.0.41-win.exe` → `1.0.41`

如果无法识别版本号，会根据文件修改时间选择最新的文件。

## 本地测试

如果你想在本地测试功能：

1. 先生成 `version.json`：
   ```bash
   node -e "const fs = require('fs'); const path = require('path'); const downloadsDir = path.join(__dirname, 'downloads'); const files = fs.readdirSync(downloadsDir).filter(file => { const ext = path.extname(file).toLowerCase(); return ext === '.exe' || ext === '.dmg' || ext === '.zip'; }); const fileInfo = files.map(file => { const filePath = path.join(downloadsDir, file); const stats = fs.statSync(filePath); let version = 'unknown'; const versionMatch = file.match(/v?(\d+\.\d+\.\d+)/i); if (versionMatch) { version = versionMatch[1]; } let platform = 'unknown'; const ext = path.extname(file).toLowerCase(); if (ext === '.exe' || file.toLowerCase().includes('win')) platform = 'windows'; else if (ext === '.dmg' || file.toLowerCase().includes('mac')) platform = 'macos'; return { filename: file, version: version, platform: platform, size: stats.size, modified: stats.mtime.toISOString() }; }); fileInfo.sort((a, b) => new Date(b.modified) - new Date(a.modified)); const latestWindows = fileInfo.find(f => f.platform === 'windows'); const latestMac = fileInfo.find(f => f.platform === 'macos'); const latestVersion = latestWindows?.version || latestMac?.version || 'unknown'; const latestDate = fileInfo[0]?.modified ? new Date(fileInfo[0].modified).toISOString().split('T')[0] : 'unknown'; const result = { generatedAt: new Date().toISOString(), latestVersion: latestVersion, releaseDate: latestDate, files: fileInfo, downloads: { windows: latestWindows?.filename || null, macos: latestMac?.filename || null } }; fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify(result, null, 2));"
   ```

2. 启动本地服务器：
   ```bash
   python -m http.server 8000
   ```

3. 访问 `http://localhost:8000` 查看效果

## 注意事项

1. **不要手动修改 version.json**：这个文件是自动生成的，手动修改会被 GitHub Actions 覆盖
2. **文件命名建议**：包含版本号和平台信息，便于系统识别
3. **保留历史版本**：可以保留旧版本在 `downloads/` 目录，系统会自动选择最新的
4. **GitHub 权限**：确保 GitHub Actions 有写仓库的权限（默认已配置）

## 故障排查

### GitHub Actions 没有自动运行？

检查：
1. 确认工作流文件在 `.github/workflows/` 目录下
2. 确认推送到了 `main` 或 `master` 分支
3. 确认修改了 `downloads/` 目录下的文件

### 下载链接没有更新？

检查：
1. 确认 `version.json` 已成功生成并提交
2. 检查浏览器缓存，强制刷新页面（Ctrl+F5）
3. 查看 Cloudflare Pages 部署状态

### 平台识别错误？

确保文件名符合以下规则：
- Windows：包含 `.exe` 或 `win`
- macOS：包含 `.dmg` 或 `mac`
