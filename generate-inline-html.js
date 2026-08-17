const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'packages', 'web', 'dist');
const outputPath = path.join(__dirname, 'packages', 'server', 'mobile-pages-inline.html');

// 读取 index.html
let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

// 添加全局变量标记，让 React 知道这是移动端页面
const mobileMarker = `<script>window.__MOBILE_PAGE__ = true;</script>`;
html = html.replace('</head>', `${mobileMarker}</head>`);

// 读取所有 JS 文件并内联
const assetsPath = path.join(distPath, 'assets');
const allJsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));

let inlineScripts = '';
let totalSize = 0;

for (const jsFile of allJsFiles) {
  const jsPath = path.join(assetsPath, jsFile);
  const jsContent = fs.readFileSync(jsPath, 'utf-8');
  inlineScripts += `<script type="module">${jsContent}</script>\n`;
  totalSize += jsContent.length;
  console.log(`✓ Inlined: ${jsFile} (${(jsContent.length / 1024).toFixed(0)} KB)`);
}

// 替换 HTML 中的 script 和 link 标签为内联脚本
html = html.replace(/<script type="module" crossorigin src="\/assets\/[^ "]+"><\/script>/g, '');
html = html.replace(/<link rel="modulepreload" crossorigin href="\/assets\/ [^"]+">/g, '');
html = html.replace('</body>', `${inlineScripts}</body>`);

// 写入输出文件
fs.writeFileSync(outputPath, html, 'utf-8');

console.log(`\n✓ Generated inline HTML: ${outputPath}`);
console.log(`  File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
