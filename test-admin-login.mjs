async function testLogin() {
  try {
    console.log('正在测试管理员登录接口...');
    
    const response = await fetch('http://localhost:4000/api/v1/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ltd.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('登录响应:', data);
  } catch (error) {
    console.error('登录错误:', error);
  }
}

testLogin();