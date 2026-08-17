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
const jsFiles = [
  'assets/index-Du_yYkyD.js',
  'assets/react-dom-WKMewNdz.js',
  'assets/client-Bi0hG3BE.js',
  'assets/jsx-runtime-BSzLRKme.js',
  'assets/UserOutlined-DRFStsjd.js',
  'assets/button-D6Oa9lj-.js',
  'assets/axios-WTvwPmkR.js',
  'assets/row-BOes9b42.js',
  'assets/api-DjJorteA.js',
  'assets/dropdown-DKMfrtFX.js',
  'assets/table-DDtBoOWE.js',
  'assets/popover-Ch3yi1rp.js',
  'assets/popconfirm-C1XveKBq.js'
];

let inlineScripts = '';

for (const jsFile of jsFiles) {
  const jsPath = path.join(distPath, jsFile);
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    inlineScripts += `<script type="module">${jsContent}</script>\n`;
    console.log(`✓ Inlined: ${jsFile} (${(jsContent.length / 1024).toFixed(0)} KB)`);
  } else {
    console.warn(` Missing: ${jsFile}`);
  }
}

// 替换 HTML 中的 script 标签为内联脚本
html = html.replace(/<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>/g, '');
html = html.replace('</body>', `${inlineScripts}</body>`);

// 写入输出文件
fs.writeFileSync(outputPath, html, 'utf-8');

console.log(`\n✓ Generated inline HTML: ${outputPath}`);
console.log(`  File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
