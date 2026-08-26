const fs = require('fs');
const path = require('path');

// 跨平台源文件路径
const isWin = process.platform === 'win32';
const sourceFile = isWin
  ? 'C:\\NeilData\\Project\\MDEditor\\docs\\版本升级摘要说明.md'
  : path.join(process.env.HOME, 'Project/MDEditor/docs/版本升级摘要说明.md');

const outputPath = path.join(__dirname, '..', 'site', 'changelog.json');

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: 找不到源文件 ${sourceFile}`);
  process.exit(1);
}

const content = fs.readFileSync(sourceFile, 'utf-8');
const lines = content.split('\n');

const versions = [];
let current = null;

for (const line of lines) {
  // 匹配版本标题 ## 1.0.xxx
  const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
  if (versionMatch) {
    if (current) versions.push(current);
    current = { version: versionMatch[1], date: '', changes: [] };
    continue;
  }

  if (!current) continue;

  // 匹配日期行
  const dateMatch = line.match(/\*\*日期\*\*[：:]\s*(.+)/);
  if (dateMatch) {
    current.date = dateMatch[1].trim();
    continue;
  }

  // 匹配更新条目
  const itemMatch = line.match(/^- (.+)/);
  if (itemMatch) {
    current.changes.push(itemMatch[1]);
  }
}

if (current) versions.push(current);

if (versions.length === 0) {
  console.error('Error: 未解析到任何版本信息');
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(versions, null, 2), 'utf-8');
console.log(`✓ changelog.json 已生成，共 ${versions.length} 个版本`);
