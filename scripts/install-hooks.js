#!/usr/bin/env node

/**
 * Git Hooks 安装脚本
 * 自动配置 pre-commit hook 以实现版本文件自动生成
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const hooksDir = path.join(projectRoot, '.git', 'hooks');
const preCommitHookPath = path.join(hooksDir, 'pre-commit');

// Git pre-commit hook 内容（跨平台版本）
const preCommitHook = `#!/bin/sh
# Git pre-commit hook
# Auto-generate version.json before commit

echo "🔄 Generating version.json..."

# 使用 git 命令获取项目根目录
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 运行生成脚本
node "$PROJECT_ROOT/scripts/generate-version.js"

if [ $? -ne 0 ]; then
  echo "✗ version.json generation failed"
  exit 1
fi

# 如果 version.json 存在，添加到暂存区
if [ -f "$PROJECT_ROOT/version.json" ]; then
  git add version.json
  echo "✓ version.json staged for commit"
fi

exit 0
`;

// Windows 专用的 bat 版本
const preCommitBat = `@echo off
REM Git pre-commit hook for Windows
REM Auto-generate version.json before commit

echo Generating version.json...

cd /d "%~dp0.."
node scripts\\generate-version.js

if %ERRORLEVEL% NEQ 0 (
  echo version.json generation failed
  exit /b %ERRORLEVEL%
)

REM Check if version.json exists and add it
if exist "version.json" (
  git add version.json
  echo version.json staged for commit
)

exit /b 0
`;

console.log('🔧 开始安装 Git Hooks...\n');

// 确保 hooks 目录存在
if (!fs.existsSync(hooksDir)) {
  console.log('📁 创建 hooks 目录...');
  fs.mkdirSync(hooksDir, { recursive: true });
}

// 写入 pre-commit hook (Unix/Linux/Mac)
console.log('📝 写入 pre-commit hook (Unix/Linux/Mac)...');
fs.writeFileSync(preCommitHookPath, preCommitHook, { mode: 0o755 });
console.log('  ✓ pre-commit hook 已创建');

// 写入 pre-commit.bat (Windows)
const preCommitBatPath = path.join(hooksDir, 'pre-commit.bat');
console.log('📝 写入 pre-commit.bat (Windows)...');
fs.writeFileSync(preCommitBatPath, preCommitBat);
console.log('  ✓ pre-commit.bat 已创建');

// 验证 scripts/generate-version.js 是否存在
const generateScript = path.join(projectRoot, 'scripts', 'generate-version.js');
if (!fs.existsSync(generateScript)) {
  console.error('\n❌ 错误：scripts/generate-version.js 不存在!');
  console.error('请确保该脚本已创建。');
  process.exit(1);
}

console.log('\n✅ Git Hooks 安装成功!\n');
console.log('📋 使用说明:');
console.log('   1. 将新版本的安装包放入 downloads/ 目录');
console.log('   2. 运行 git add downloads/');
console.log('   3. 运行 git commit -m "发布新版本"');
console.log('      → 此时会自动生成并更新 version.json');
console.log('   4. 运行 git push');
console.log('\n🎯 配置完成! 现在可以自动管理版本文件了。\n');
