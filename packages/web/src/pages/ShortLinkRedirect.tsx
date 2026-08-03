import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { API_BASE_URL } from '../config/api';

/**
 * 短链跳转组件
 * 处理 /t/:shortCode 路由，从后端获取目标地址后跳转
 */
export default function ShortLinkRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortCode) {
      setError('无效的链接');
      return;
    }

    const resolveAndRedirect = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/t/${shortCode}?resolve=true`, {
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        if (data.code === 0 && data.data?.targetUrl) {
          // 使用 window.location 直接跳转（保留追踪统计）
          window.location.href = data.data.targetUrl;
        } else {
          setError('链接不存在或已失效');
        }
      } catch {
        setError('链接解析失败，请检查网络');
      }
    };

    resolveAndRedirect();
  }, [shortCode]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Result status="404" title="链接无效" subTitle={error} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" tip="正在跳转..." />
    </div>
  );
}
