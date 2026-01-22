/**
 * 独立追踪脚本
 * 可以在任何网页上使用，只需在 HTML 中添加：
 * <script src="http://110.40.153.38:5707/tracking.js"></script>
 */

(function() {
  'use strict';

  // 配置
  const API_BASE_URL = 'http://110.40.153.38:5707/api';
  
  // 获取用户唯一标识（从localStorage或生成新ID）
  function getUserId() {
    let userId = localStorage.getItem('tracking_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tracking_user_id', userId);
    }
    return userId;
  }

  // 获取会话ID（用于识别同一次访问）
  function getSessionId() {
    let sessionId = sessionStorage.getItem('tracking_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('tracking_session_id', sessionId);
    }
    return sessionId;
  }

  // 获取设备信息
  function getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  // 发送埋点数据到后端服务器
  async function trackEvent(eventType, eventData = {}) {
    try {
      const trackingData = {
        event: eventType,
        timestamp: new Date().toISOString(),
        userId: getUserId(),
        sessionId: getSessionId(),
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || '',
        device: getDeviceInfo(),
        ...eventData
      };

      const response = await fetch(API_BASE_URL + '/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const result = await response.json();
      console.log('[Tracking] Event sent:', eventType, result);
      return result;
    } catch (error) {
      console.error('[Tracking] Error sending event:', eventType, error);
      return null;
    }
  }

  // 追踪页面访问
  function trackPageView() {
    return trackEvent('page_view', {
      page: window.location.pathname,
      pageName: document.title
    });
  }

  // 追踪滚动深度
  let scrollTracked = { 25: false, 50: false, 75: false, 100: false };
  function handleScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

    if (scrollPercent >= 25 && !scrollTracked[25]) {
      trackEvent('scroll_depth', { scrollPercent: 25, milestone: '25%' });
      scrollTracked[25] = true;
    }
    if (scrollPercent >= 50 && !scrollTracked[50]) {
      trackEvent('scroll_depth', { scrollPercent: 50, milestone: '50%' });
      scrollTracked[50] = true;
    }
    if (scrollPercent >= 75 && !scrollTracked[75]) {
      trackEvent('scroll_depth', { scrollPercent: 75, milestone: '75%' });
      scrollTracked[75] = true;
    }
    if (scrollPercent >= 100 && !scrollTracked[100]) {
      trackEvent('scroll_depth', { scrollPercent: 100, milestone: '100%' });
      scrollTracked[100] = true;
    }
  }

  // 追踪页面停留时长
  let startTime = Date.now();
  function trackPageTime() {
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (duration > 0) {
      trackEvent('time_on_page', { duration: duration });
    }
  }

  // 追踪链接点击
  function trackLinkClicks() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href) {
        trackEvent('link_click', {
          linkUrl: link.href,
          linkText: link.textContent || ''
        });
      }
    });
  }

  // 追踪按钮点击
  function trackButtonClicks() {
    document.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        trackEvent('button_click', {
          buttonName: button.textContent || button.id || button.className || 'unknown'
        });
      }
    });
  }

  // 初始化
  function init() {
    // 追踪页面访问
    trackPageView();

    // 追踪滚动深度
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 追踪页面停留时长
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        trackPageTime();
      } else {
        startTime = Date.now();
      }
    });

    window.addEventListener('beforeunload', function() {
      trackPageTime();
    });

    // 追踪链接和按钮点击
    trackLinkClicks();
    trackButtonClicks();
  }

  // 当 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露全局 API（可选）
  window.tracking = {
    track: trackEvent,
    trackPageView: trackPageView,
    trackEvent: trackEvent
  };

})();

