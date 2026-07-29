/**
 * LTD 访客追踪 SDK
 * 用于嵌入官网，追踪访客行为并生成线索
 */

interface LTDConfig {
  tenantId: string;
  apiBase?: string;
  autoTrack?: boolean;
  debug?: boolean;
}

interface TrackEvent {
  type: 'pageview' | 'click' | 'form' | 'scroll' | 'leave' | 'custom';
  url: string;
  title: string;
  timestamp: number;
  data?: any;
}

class LTDTracker {
  private config: Required<LTDConfig>;
  private visitorId: string;
  private sessionId: string;
  private pageStartTime: number;
  private scrollDepth: number = 0;
  private trackedElements: Set<Element> = new Set();

  constructor(config: LTDConfig) {
    this.config = {
      tenantId: config.tenantId,
      apiBase: config.apiBase || 'https://api.ltd.com',
      autoTrack: config.autoTrack !== false,
      debug: config.debug || false,
    };

    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();

    if (this.config.autoTrack) {
      this.initAutoTracking();
    }

    this.log('LTD Tracker initialized', { visitorId: this.visitorId });
  }

  /**
   * 初始化自动追踪
   */
  private initAutoTracking() {
    // 页面加载完成时追踪 PV
    if (document.readyState === 'complete') {
      this.trackPageView();
    } else {
      window.addEventListener('load', () => this.trackPageView());
    }

    // 监听页面离开
    window.addEventListener('beforeunload', () => {
      this.trackPageLeave();
    });

    // 监听滚动
    window.addEventListener('scroll', this.throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > this.scrollDepth) {
        this.scrollDepth = scrollPercent;
      }
    }, 200));

    // 监听点击事件
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      this.trackClick(target);
    });

    // 监听表单提交
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      this.trackFormSubmit(form);
    });

    // 监听 SPA 路由变化
    this.watchHistoryChange();
  }

  /**
   * 追踪页面浏览
   */
  trackPageView() {
    const event: TrackEvent = {
      type: 'pageview',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        referrer: document.referrer,
        utm: this.getUTMParams(),
      },
    };
    this.send(event);
    this.pageStartTime = Date.now();
    this.scrollDepth = 0;
  }

  /**
   * 追踪点击事件
   */
  private trackClick(target: HTMLElement) {
    const trackable = target.closest('[data-ltd-track]') as HTMLElement;
    if (!trackable) return;

    const event: TrackEvent = {
      type: 'click',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        element: trackable.tagName.toLowerCase(),
        text: trackable.innerText?.slice(0, 100),
        trackId: trackable.dataset.ltdTrack,
      },
    };
    this.send(event);
  }

  /**
   * 追踪表单提交
   */
  private trackFormSubmit(form: HTMLFormElement) {
    const formData: Record<string, string> = {};
    const elements = form.elements;
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLInputElement;
      if (el.name && el.type !== 'password') {
        formData[el.name] = el.value;
      }
    }

    const event: TrackEvent = {
      type: 'form',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        formId: form.id || form.name,
        formData,
      },
    };
    this.send(event);
  }

  /**
   * 追踪页面离开
   */
  private trackPageLeave() {
    const stayDuration = Date.now() - this.pageStartTime;
    const event: TrackEvent = {
      type: 'leave',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        stayDuration,
        scrollDepth: this.scrollDepth,
      },
    };
    this.sendBeacon(event);
  }

  /**
   * 自定义事件追踪
   */
  track(eventName: string, eventData?: any) {
    const event: TrackEvent = {
      type: 'custom',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        eventName,
        ...eventData,
      },
    };
    this.send(event);
  }

  /**
   * 识别访客（登录后调用）
   */
  identify(userId: string, userInfo: Record<string, any>) {
    const event: TrackEvent = {
      type: 'custom',
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      data: {
        eventName: 'identify',
        userId,
        userInfo,
      },
    };
    this.send(event);
  }

  /**
   * 发送追踪数据
   */
  private send(event: TrackEvent) {
    const payload = {
      tenantId: this.config.tenantId,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      ...event,
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language,
    };

    this.log('Track event:', event.type, payload);

    // 使用 sendBeacon 确保页面关闭时也能发送
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${this.config.apiBase}/api/v1/visitor/track`, blob);
    } else {
      fetch(`${this.config.apiBase}/api/v1/visitor/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  /**
   * 使用 sendBeacon 发送（用于页面离开时）
   */
  private sendBeacon(event: TrackEvent) {
    const payload = {
      tenantId: this.config.tenantId,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      ...event,
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language,
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${this.config.apiBase}/api/v1/visitor/track`, blob);
    }
  }

  /**
   * 获取或创建访客 ID
   */
  private getOrCreateVisitorId(): string {
    let vid = localStorage.getItem('ltd_vid');
    if (!vid) {
      vid = 'v_' + this.generateId();
      localStorage.setItem('ltd_vid', vid);
    }
    return vid;
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return 's_' + this.generateId();
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 获取 UTM 参数
   */
  private getUTMParams(): Record<string, string> {
    const params = new URLSearchParams(location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utm: Record<string, string> = {};
    utmKeys.forEach(key => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  }

  /**
   * 监听 History API 变化（SPA 支持）
   */
  private watchHistoryChange() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      self.trackPageView();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      self.trackPageView();
    };

    window.addEventListener('popstate', () => self.trackPageView());
  }

  /**
   * 节流函数
   */
  private throttle(fn: Function, delay: number) {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall > delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * 调试日志
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[LTD Tracker]', ...args);
    }
  }
}

// 全局初始化函数
(window as any).LTDTracker = LTDTracker;

// 自动初始化（如果 script 标签带有 data-tenant-id 属性）
const script = document.currentScript as HTMLScriptElement;
if (script && script.dataset.tenantId) {
  new LTDTracker({
    tenantId: script.dataset.tenantId,
    apiBase: script.dataset.apiBase,
    autoTrack: script.dataset.autoTrack !== 'false',
    debug: script.dataset.debug === 'true',
  });
}

export default LTDTracker;
