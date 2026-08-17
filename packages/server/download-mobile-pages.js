const fs = require('fs');
const path = require('path');
const https = require('https');

// GitHub raw content URL for mobile pages
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/panhongliang789/LTD/master/packages/web/dist';

const filesToDownload = [
  'index.html',
  'favicon.svg',
  '_headers',
  '_redirects'
];

const assetsDir = path.join(__dirname, 'dist', 'web-assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${GITHUB_RAW_URL}/${filename}`;
    const filePath = path.join(assetsDir, filename);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${filename}`);
          resolve();
        });
      } else {
        file.close();
        fs.unlink(filePath, () => {});
        console.error(`✗ Failed to download ${filename}: HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      console.error(`✗ Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading mobile pages from GitHub...');
  
  try {
    await Promise.all(filesToDownload.map(downloadFile));
    console.log('✓ All files downloaded successfully');
  } catch (error) {
    console.error('Failed to download some files:', error);
    process.exit(1);
  }
}

main();
