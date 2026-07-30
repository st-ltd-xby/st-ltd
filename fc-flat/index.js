// 阿里云函数计算 FC 入口
const path = require('path');

// 使用 __dirname 绝对路径，兼容 FC 的 /code 目录
const appPath = path.join(__dirname, 'packages', 'server', 'dist', 'app.js');
const seedPath = path.join(__dirname, 'packages', 'server', 'dist', 'common', 'seed.js');

console.log('FC handler loading, appPath:', appPath);

let app;
try {
  app = require(appPath).default;
  console.log('Express app loaded successfully');
} catch (e) {
  console.error('Failed to load app:', e.message);
  console.error('Stack:', e.stack);
  throw e;
}

let seeded = false;

module.exports.handler = async (req, res) => {
  // 首次请求时执行数据库初始化
  if (!seeded) {
    seeded = true;
    try {
      const { autoSeed } = require(seedPath);
      await autoSeed();
      console.log('Database seeded successfully');
    } catch (e) {
      console.error('Seed error:', e.message);
    }
  }
  app(req, res);
};
