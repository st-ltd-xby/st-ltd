const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4000/api/v1/auth/admin-login', {
      email: 'admin@ltd.com',
      password: 'admin'
    });
    
    console.log('登录响应:', response.data);
  } catch (error) {
    console.error('登录错误:', error.response?.data || error.message);
  }
}

testLogin();