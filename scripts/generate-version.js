const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, '..', 'downloads');
const versionJsonPath = path.join(__dirname, '..', 'version.json');

// 确保 downloads 目录存在
if (!fs.existsSync(downloadsDir)) {
  console.error('Error: downloads directory not found');
  process.exit(1);
}

// 扫描下载文件
const files = fs.readdirSync(downloadsDir).filter(file => {
  if (file === '.gitkeep') return false;
  const ext = path.extname(file).toLowerCase();
  return ext === '.exe' || ext === '.dmg' || ext === '.zip';
});

if (files.length === 0) {
  console.log('No download files found, skipping version.json generation');
  process.exit(0);
}

// 构建文件信息
const fileInfo = files.map(file => {
  const filePath = path.join(downloadsDir, file);
  const stats = fs.statSync(filePath);
  
  let version = 'unknown';
  const versionMatch = file.match(/v?(\d+\.\d+\.\d+)/i);
  if (versionMatch) {
    version = versionMatch[1];
  }
  
  let platform = 'unknown';
  const ext = path.extname(file).toLowerCase();
  if (ext === '.exe' || file.toLowerCase().includes('win')) {
    platform = 'windows';
  } else if (ext === '.dmg' || file.toLowerCase().includes('mac')) {
    platform = 'macos';
  }
  
  return {
    filename: file,
    version: version,
    platform: platform,
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
});

// 按修改时间排序，最新的在前
fileInfo.sort((a, b) => new Date(b.modified) - new Date(a.modified));

// 查找各平台最新版本
const latestWindows = fileInfo.find(f => f.platform === 'windows');
const latestMac = fileInfo.find(f => f.platform === 'macos');

// 获取最新版本号
const latestVersion = latestWindows?.version || latestMac?.version || 'unknown';
const latestDate = fileInfo[0]?.modified ? new Date(fileInfo[0].modified).toISOString().split('T')[0] : 'unknown';

// 生成 version.json
const result = {
  generatedAt: new Date().toISOString(),
  latestVersion: latestVersion,
  releaseDate: latestDate,
  files: fileInfo,
  downloads: {
    windows: latestWindows?.filename || null,
    macos: latestMac?.filename || null
  }
};

fs.writeFileSync(versionJsonPath, JSON.stringify(result, null, 2));
console.log('✓ version.json generated successfully!');
console.log(`  Latest Windows: ${latestWindows?.filename || 'N/A'}`);
console.log(`  Latest macOS: ${latestMac?.filename || 'N/A'}`);
console.log(`  Version: ${latestVersion}`);
