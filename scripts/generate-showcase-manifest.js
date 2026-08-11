const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const showcaseRoot = path.join(projectRoot, 'site', 'assets', 'showcase');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const categories = ['ppt', 'Page'];

categories.forEach(category => {
  const dir = path.join(showcaseRoot, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${path.relative(projectRoot, dir)}`);
  }
  const manifestPath = path.join(dir, 'manifest.json');
  const images = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

  fs.writeFileSync(manifestPath, `${JSON.stringify({ images }, null, 2)}\n`, 'utf8');
  console.log(`Generated ${path.relative(projectRoot, manifestPath)} with ${images.length} image(s).`);
});
