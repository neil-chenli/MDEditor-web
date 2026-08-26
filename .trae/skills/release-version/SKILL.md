---
name: "release-version"
description: "执行 MDEditor 发版流程：打包、复制安装包到 downloads、更新版本信息。当用户说 /发布新版 或要求发布新版本时调用。"
---

# 发布新版

当用户触发发版指令时，执行以下完整流程。根据当前操作系统自动判断处理 Windows 或 macOS 版本。

## 触发条件

用户说出以下任一表述时触发：
- `/发布新版`
- `发布新版本`
- `发版`

## 发版流程

### Windows 环境（检测到 win32）

源目录：`C:\NeilData\Project\MDEditor\src-tauri\target\release\bundle\nsis`

1. **查找最新 exe**：扫描源目录，找到文件名匹配 `MDEditor_*_x64-setup.exe` 且版本号最大的文件（版本号格式为 `1.0.xxx`，按数字部分比较大小）
2. **压缩为 zip**：使用 PowerShell `Compress-Archive` 将该 exe 压缩为同名 `.zip` 文件（如 `MDEditor_1.0.714_x64-setup.zip`）
3. **清理旧文件**：删除 `downloads` 目录中旧的 Windows zip 文件（匹配 `*_x64-setup.zip`）
4. **复制新文件**：将压缩好的 zip 复制到项目的 `downloads` 目录
5. **更新版本信息**：运行 `node scripts/generate-version.js` 更新 `version.json`
6. **更新更新日志**：运行 `node scripts/generate-changelog.js` 更新 `site/changelog.json`
7. **展示结果**：显示新版本号、文件大小等信息

### macOS 环境（检测到 darwin）

源目录：`/Users/neil/Project/MDEditor/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg`

1. **检查源目录**：确认源目录存在；如果不存在，立即报错并停止执行。
2. **查找最新 dmg**：扫描源目录中匹配 `MDEditor_*_aarch64.dmg` 的文件，从文件名解析 `1.0.xxx` 版本号，按版本号中的数字降序排序并选择最新文件；如果没有匹配文件，立即报错并停止执行。
3. **清理旧文件**：删除 `downloads` 目录中旧的 macOS DMG 文件，仅匹配 `MDEditor_*_aarch64.dmg`，不要删除其他平台安装包。
4. **复制新文件**：将选中的 DMG 复制到项目的 `downloads` 目录，并保持原文件名。
5. **验证复制结果**：确认目标文件存在且文件大小大于 0；验证失败时立即报错并停止执行。
6. **更新版本信息**：运行 `node scripts/generate-version.js` 更新 `version.json`。
7. **更新更新日志**：运行 `node scripts/generate-changelog.js` 更新 `site/changelog.json`。
8. **展示结果**：显示版本号、文件名和文件大小。

### 发布版本信息到服务端

**前置条件：等待线上部署完成**

在推送代码后，安装包需要经过 GitHub Actions 部署到服务器才能被下载。必须先验证线上文件可用，再发布版本记录。

**验证步骤：**
1. 根据平台构造下载链接：
   - Windows: `https://md.shuyu.com/downloads/MDEditor_{version}_x64-setup.zip`
   - macOS: `https://md.shuyu.com/downloads/MDEditor_{version}_aarch64.dmg`
2. 每隔 15 秒发送一次 HEAD 请求检测该 URL 是否返回 200
3. 最多轮询 5 分钟（20 次）
4. 如果 5 分钟内检测通过（HTTP 200），继续发布版本信息
5. 如果 5 分钟后仍未通过，输出警告并询问用户是否继续等待或跳过此步骤

**验证通过后，调用服务端接口发布版本信息：**

**接口：** `POST https://api.shuyu.com/api/client/release`

**认证：** `Authorization: Bearer mde-release-x7k9m2p4w8n1v3b6`

**请求体字段：**
- `platform`: 当前平台（"windows" 或 "mac"）
- `version`: 新版本号（如 "1.0.715"）
- `release_date`: 从 `C:\NeilData\Project\MDEditor\docs\版本升级摘要说明.md`（Windows）或 `~/Project/MDEditor/docs/版本升级摘要说明.md`（macOS）中解析对应版本的日期，格式为 `YYYY-MM-DDT00:00:00`（如 "2026-08-26T00:00:00"）
- `release_notes`: 从同一文件中解析对应版本号下的 bullet list，将所有条目用换行符拼接为一段文本
- `download_url`: 固定填写 `https://md.shuyu.com/`
- `is_force_update`: false

**release_notes 解析规则：**
1. 读取 `版本升级摘要说明.md`
2. 找到 `## {version}` 标题（如 `## 1.0.715`）
3. 跳过 `**日期**：xxx` 行
4. 提取该标题下所有 `- xxx` 开头的行，去掉前缀 `- `，用换行符 `\n` 拼接

**示例请求：**
```json
{
  "platform": "windows",
  "version": "1.0.715",
  "release_date": "2026-08-26",
  "release_notes": "修复-首页 AI 写作输入\"做成 PPT\"等短指令时可能提示服务不可用的问题。\n修复-PPT 结束页\"感谢聆听\"重复显示的问题。\n优化-PPT 章节页生成规则，保持大纲生成与直接生成 PPT 的结果一致。",
  "download_url": "https://md.shuyu.com/",
  "is_force_update": false
}
```

**错误处理：** 如果接口调用失败（非 2xx），输出错误信息但不中断整体流程（本地文件已更新成功）。

### 通用后续步骤（可选）

- **推送更新**：如果用户在指令中要求推送（如"发布新版并推送"、"发版后推一下"），则执行 git add downloads/ version.json site/changelog.json → git commit → git push。如果用户没有明确要求推送，不执行此步骤。

**注意流程时序：** 当用户要求推送时，完整执行顺序为：
1. 本地文件更新（压缩、复制、generate-version、generate-changelog）
2. git add → commit → push（触发线上部署）
3. 等待线上部署完成（轮询检测下载链接）
4. 验证通过后，调用服务端 release 接口

## 执行要求

- 每个步骤执行完都要输出进度
- 如果找不到源目录或文件，立即报错并停止
- 压缩完成后验证 zip 文件是否生成成功
- 最终展示完整的发版摘要（版本号、文件名、文件大小）

## 示例输出

```
正在发布新版...
✓ 找到最新安装包：MDEditor_1.0.714_x64-setup.exe
✓ 已压缩为：MDEditor_1.0.714_x64-setup.zip (13.5 MB)
✓ 已清理旧版本文件
✓ 已复制到 downloads 目录
✓ version.json 已更新
  - 最新版本：1.0.714
  - Windows：MDEditor_1.0.714_x64-setup.zip
  - macOS：MDEditor_1.0.712_aarch64.dmg

发版完成！
```
