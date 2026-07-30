// 最简测试 handler - 不加载任何外部文件
module.exports.handler = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ 
    status: 'ok', 
    test: 'handler works!',
    nodeVersion: process.version,
    cwd: process.cwd(),
    dirname: __dirname
  }));
};
