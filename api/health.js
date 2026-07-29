// Minimal test function for Vercel
module.exports = function handler(req, res) {
  res.json({ 
    status: 'ok', 
    message: 'ST-LTD API is running',
    timestamp: new Date().toISOString()
  });
};
