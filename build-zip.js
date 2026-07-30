const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

// 如果没装 archiver，用内置 zip 方式
const AdmZip = require('adm-zip');

const zip = new AdmZip();
const distDir = path.join(__dirname, 'fc-dist');

function addDir(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const zipPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === '.cache' || entry.name === '.pnpm') continue;
      addDir(fullPath, zipPath);
    } else {
      zip.addLocalFile(fullPath, prefix || '');
    }
  }
}

addDir(distDir, '');
zip.writeZip(path.join(__dirname, 'fc-deploy.zip'));
console.log('Zip created with adm-zip');
