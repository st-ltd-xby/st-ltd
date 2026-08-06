import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * 访客追踪 Hook
 * 页面加载时自动记录访客行为（pageview）
 */
export function useVisitorTrack(tenantId?: string) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!tenantId || trackedRef.current) return;
    trackedRef.current = true;

    // 生成或获取访客 ID
    let visitorId = localStorage.getItem('ltd_vid');
    if (!visitorId) {
      visitorId = 'v_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      localStorage.setItem('ltd_vid', visitorId);
    }

    const sessionId = 's_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);

    // 检测推广短链参数
    const urlParams = new URLSearchParams(location.search);
    const promoCode = urlParams.get('promo') || undefined;

    // 发送 pageview 事件
    const payload = {
      tenantId,
      visitorId,
      sessionId,
      type: 'pageview',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        referrer: document.referrer,
      },
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language,
      promoCode,
    };

    // 使用 sendBeacon 或 fetch 发送
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE_URL}/api/v1/visitor/track`, blob);
    } else {
      fetch(`${API_BASE_URL}/api/v1/visitor/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [tenantId]);
}
