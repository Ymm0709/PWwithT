/**
 * 独立追踪脚本
 * 可以在任何网页上使用，只需在 HTML 中添加：
 * <script src="http://110.40.153.38:5707/tracking.js"></script>
 */

(function() {
  'use strict';

  // 配置
  const API_BASE_URL = 'http://110.40.153.38:5707/api';

  // =========================
  // 流量来源识别（Session Attribution）
  // =========================
  const SESSION_ATTR_KEY = 'tracking_session_attribution_v1';

  function safeUrlParse(url) {
    try {
      return new URL(url);
    } catch (e) {
      return null;
    }
  }

  function getReferrerHost(referrer) {
    const u = safeUrlParse(referrer);
    return (u && u.hostname ? u.hostname.toLowerCase() : '') || '';
  }

  function parseQueryParamsFromCurrentUrl() {
    const u = safeUrlParse(window.location.href);
    if (!u) return {};

    const get = (k) => u.searchParams.get(k) || '';

    const utm = {
      utm_source: get('utm_source'),
      utm_medium: get('utm_medium'),
      utm_campaign: get('utm_campaign'),
      utm_term: get('utm_term'),
      utm_content: get('utm_content')
    };

    const clickIds = [
      ['gclid', 'google'],
      ['msclkid', 'bing'],
      ['fbclid', 'meta'],
      ['ttclid', 'tiktok'],
      ['twclid', 'twitter'],
      ['igshid', 'instagram']
    ];

    let click_id = '';
    let click_id_type = '';
    for (const [key, type] of clickIds) {
      const v = get(key);
      if (v) {
        click_id = v;
        click_id_type = type;
        break;
      }
    }

    return { ...utm, click_id, click_id_type };
  }

  function channelFromMedium(medium, source) {
    const m = (medium || '').toLowerCase();
    const s = (source || '').toLowerCase();

    if (m === '(none)' || m === 'none') return 'Direct';
    if (m === 'organic') return 'Organic Search';
    if (m === 'referral') return 'Referral';
    if (m === 'email' || m === 'edm' || m === 'newsletter') return 'Email';
    if (m === 'social' || m === 'social-network' || m === 'social_media') return 'Social';
    if (m === 'affiliate') return 'Affiliate';
    if (m === 'display' || m === 'banner' || m === 'cpm') return 'Display';
    if (m === 'cpc' || m === 'ppc' || m === 'paidsearch' || m === 'paid_search') return 'Paid Search';
    if (m === 'paidsocial' || m === 'paid_social') return 'Paid Social';

    if (s.includes('weixin') || s.includes('wechat')) return 'Social';
    if (s.includes('weibo') || s.includes('zhihu')) return 'Social';
    return 'Other';
  }

  function detectInAppSource(userAgent) {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('micromessenger')) {
      if (ua.includes('macwechat')) return 'MacWechat';
      if (ua.includes('windowswechat')) return 'WindowsWechat';
      return 'WeChat';
    }
    if (ua.includes('dingtalk') || ua.includes('aliapp(dingtalk')) return 'DingTalk';
    if (ua.includes(' qq/') || ua.includes('mqqbrowser') || ua.includes('qqbrowser')) return 'QQ';
    if (ua.includes('weibo')) return 'Weibo';
    if (ua.includes('zhihu')) return 'Zhihu';
    if (ua.includes('aweme') || ua.includes('douyin')) return 'Douyin';
    if (ua.includes('toutiao')) return 'Toutiao';
    if (ua.includes('xhs') || ua.includes('xiaohongshu')) return 'Xiaohongshu';
    if (ua.includes('lark') || ua.includes('feishu')) return 'Feishu';
    if (ua.includes('telegram')) return 'Telegram';
    if (ua.includes('whatsapp')) return 'WhatsApp';
    return '';
  }

  function classifyTraffic({ referrer, currentHost, utm_source, utm_medium, click_id_type }) {
    const refHost = getReferrerHost(referrer);

    const hasUtm = Boolean(utm_source || utm_medium);
    if (hasUtm) {
      const medium = (utm_medium || (click_id_type ? 'cpc' : '') || '(not set)').toLowerCase();
      const source = (utm_source || '(not set)').toLowerCase();
      return {
        traffic_source: utm_source || '(not set)',
        traffic_medium: utm_medium || (click_id_type ? 'cpc' : '(not set)'),
        traffic_channel: channelFromMedium(medium, source)
      };
    }

    if (refHost) {
      if (currentHost && refHost === currentHost.toLowerCase()) {
        return { traffic_source: '直接访问', traffic_medium: '(none)', traffic_channel: 'Direct' };
      }

      const searchEngines = new Map([
        ['www.baidu.com', '百度'],
        ['baidu.com', '百度'],
        ['m.baidu.com', '百度'],
        ['www.google.com', 'Google'],
        ['google.com', 'Google'],
        ['www.bing.com', 'Bing'],
        ['bing.com', 'Bing'],
        ['search.yahoo.com', 'Yahoo']
      ]);
      if (searchEngines.has(refHost)) {
        return { traffic_source: searchEngines.get(refHost), traffic_medium: 'organic', traffic_channel: 'Organic Search' };
      }

      const socialHosts = new Map([
        ['mp.weixin.qq.com', '微信'],
        ['weixin.qq.com', '微信'],
        ['weibo.com', '微博'],
        ['www.weibo.com', '微博'],
        ['m.weibo.cn', '微博'],
        ['zhihu.com', '知乎'],
        ['www.zhihu.com', '知乎'],
        ['twitter.com', 'Twitter'],
        ['www.twitter.com', 'Twitter'],
        ['x.com', 'Twitter'],
        ['www.x.com', 'Twitter'],
        ['facebook.com', 'Facebook'],
        ['www.facebook.com', 'Facebook'],
        ['linkedin.com', 'LinkedIn'],
        ['www.linkedin.com', 'LinkedIn'],
        ['reddit.com', 'Reddit'],
        ['www.reddit.com', 'Reddit'],
        ['im.dingtalk.com', '钉钉'],
        ['oa.dingtalk.com', '钉钉'],
        ['dingtalk.com', '钉钉'],
        ['www.dingtalk.com', '钉钉']
      ]);
      if (socialHosts.has(refHost)) {
        return { traffic_source: socialHosts.get(refHost), traffic_medium: 'social', traffic_channel: 'Social' };
      }

      const domainParts = refHost.split('.');
      const mainDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : refHost;
      return { traffic_source: mainDomain.replace(/^www\./, ''), traffic_medium: 'referral', traffic_channel: 'Referral' };
    }

    return { traffic_source: '直接访问', traffic_medium: '(none)', traffic_channel: 'Direct' };
  }

  function getSessionAttribution() {
    try {
      const existingRaw = sessionStorage.getItem(SESSION_ATTR_KEY);
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed && typeof parsed === 'object') {
          const cur = parseQueryParamsFromCurrentUrl();
          const hasCampaignNow = Boolean(cur.utm_source || cur.utm_medium || cur.click_id);
          if (hasCampaignNow && parsed.traffic_channel === 'Direct') {
            const currentHost = window.location.hostname || '';
            const referrer = parsed.entryReferrer || document.referrer || '';
            const traffic = classifyTraffic({ referrer, currentHost, ...cur });
            const updated = { ...parsed, ...cur, ...traffic };
            sessionStorage.setItem(SESSION_ATTR_KEY, JSON.stringify(updated));
            return updated;
          }
          return parsed;
        }
      }

      const entryUrl = window.location.href;
      const entryPath = window.location.pathname;
      const entryReferrer = document.referrer || '';
      const entryReferrerHost = getReferrerHost(entryReferrer);
      const currentHost = window.location.hostname || '';
      const entryUserAgent = navigator.userAgent || '';
      const clientApp = detectInAppSource(entryUserAgent);
      const params = parseQueryParamsFromCurrentUrl();
      const traffic = classifyTraffic({ referrer: entryReferrer, currentHost, ...params });

      // 兜底：referrer 为空且无 UTM 时，用 UA 识别微信/钉钉内置浏览器来源
      if (
        (!entryReferrer || entryReferrer === '') &&
        !(params.utm_source || params.utm_medium || params.click_id) &&
        traffic.traffic_channel === 'Direct'
      ) {
        if (clientApp) {
          traffic.traffic_source = clientApp;
          traffic.traffic_medium = 'social';
          traffic.traffic_channel = 'Social';
        }
      }

      const attribution = {
        entryUrl,
        entryPath,
        entryReferrer,
        entryReferrerHost,
        entryUserAgent,
        client_app: clientApp,
        ...params,
        ...traffic,
        attributionVersion: 'v1'
      };

      sessionStorage.setItem(SESSION_ATTR_KEY, JSON.stringify(attribution));
      return attribution;
    } catch (e) {
      return {};
    }
  }
  
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
      const attribution = getSessionAttribution();
      const trackingData = {
        event: eventType,
        timestamp: new Date().toISOString(),
        userId: getUserId(),
        sessionId: getSessionId(),
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || '',
        device: getDeviceInfo(),
        // 会话来源（用于行为流/来源分析）
        ...attribution,
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

