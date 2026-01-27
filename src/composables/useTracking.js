// 前端埋点工具
// 用于收集用户行为数据并通过AJAX发送到后端服务器

// API接口地址配置
// 动态构建 API 基础 URL
// 如果设置了环境变量，使用环境变量
// 否则根据当前页面的 hostname 和协议构建，使用固定端口 5707
// 注意：必须在运行时调用，不能在模块加载时计算
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 在浏览器环境中，使用当前页面的 hostname 和协议
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return `${protocol}//${hostname}:5707/api`
  }
  
  // 默认值（SSR 或构建时）
  return 'http://localhost:5707/api'
}

/**
 * =========================
 * 流量来源识别（Session Attribution）
 * =========================
 * 目标：
 * - 识别访问来源（direct / organic / social / referral / paid / email 等）
 * - 解析 UTM（utm_source/utm_medium/utm_campaign/utm_term/utm_content）
 * - 解析常见点击ID（gclid/fbclid/msclkid/ttclid 等）
 * - 将“会话首访来源”持久化到 sessionStorage，确保 SPA 跳转不会丢来源
 */

const SESSION_ATTR_KEY = 'tracking_session_attribution_v1'

function safeUrlParse(url) {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function getReferrerHost(referrer) {
  const u = safeUrlParse(referrer)
  return u?.hostname?.toLowerCase() || ''
}

function parseQueryParamsFromCurrentUrl() {
  if (typeof window === 'undefined') return {}
  const u = safeUrlParse(window.location.href)
  if (!u) return {}

  const get = (k) => u.searchParams.get(k) || ''

  const utm = {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_term: get('utm_term'),
    utm_content: get('utm_content')
  }

  // 常见点击ID（不同平台/广告系统）
  const clickIds = [
    ['gclid', 'google'],
    ['msclkid', 'bing'],
    ['fbclid', 'meta'],
    ['ttclid', 'tiktok'],
    ['twclid', 'twitter'],
    ['igshid', 'instagram']
  ]

  let click_id = ''
  let click_id_type = ''
  for (const [key, type] of clickIds) {
    const v = get(key)
    if (v) {
      click_id = v
      click_id_type = type
      break
    }
  }

  return { ...utm, click_id, click_id_type }
}

function classifyTraffic({ referrer, currentHost, utm_source, utm_medium, click_id_type }) {
  const refHost = getReferrerHost(referrer)

  // 1) UTM 优先（显式归因）
  const hasUtm = Boolean(utm_source || utm_medium)
  if (hasUtm) {
    const medium = (utm_medium || (click_id_type ? 'cpc' : '') || '(not set)').toLowerCase()
    const source = (utm_source || '(not set)').toLowerCase()
    return {
      traffic_source: utm_source || '(not set)',
      traffic_medium: utm_medium || (click_id_type ? 'cpc' : '(not set)'),
      traffic_channel: channelFromMedium(medium, source)
    }
  }

  // 2) Referrer（自然/社媒/引荐）
  if (refHost) {
    // 内部跳转（SPA/同域）不算来源
    if (currentHost && refHost === currentHost.toLowerCase()) {
      return { traffic_source: '直接访问', traffic_medium: '(none)', traffic_channel: 'Direct' }
    }

    // 搜索引擎（Organic Search）
    const searchEngines = new Map([
      ['www.baidu.com', '百度'],
      ['baidu.com', '百度'],
      ['m.baidu.com', '百度'],
      ['www.google.com', 'Google'],
      ['google.com', 'Google'],
      ['www.bing.com', 'Bing'],
      ['bing.com', 'Bing'],
      ['search.yahoo.com', 'Yahoo']
    ])
    if (searchEngines.has(refHost)) {
      return { traffic_source: searchEngines.get(refHost), traffic_medium: 'organic', traffic_channel: 'Organic Search' }
    }

    // 社交平台（Social）
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
    ])
    if (socialHosts.has(refHost)) {
      return { traffic_source: socialHosts.get(refHost), traffic_medium: 'social', traffic_channel: 'Social' }
    }

    // 默认：引荐（Referral）
    const domainParts = refHost.split('.')
    const mainDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : refHost
    return { traffic_source: mainDomain.replace(/^www\./, ''), traffic_medium: 'referral', traffic_channel: 'Referral' }
  }

  // 3) 直接访问
  return { traffic_source: '直接访问', traffic_medium: '(none)', traffic_channel: 'Direct' }
}

function channelFromMedium(medium, source) {
  const m = (medium || '').toLowerCase()
  const s = (source || '').toLowerCase()

  if (m === '(none)' || m === 'none') return 'Direct'
  if (m === 'organic') return 'Organic Search'
  if (m === 'referral') return 'Referral'
  if (m === 'email' || m === 'edm' || m === 'newsletter') return 'Email'
  if (m === 'social' || m === 'social-network' || m === 'social_media') return 'Social'
  if (m === 'affiliate') return 'Affiliate'
  if (m === 'display' || m === 'banner' || m === 'cpm') return 'Display'
  if (m === 'cpc' || m === 'ppc' || m === 'paidsearch' || m === 'paid_search') return 'Paid Search'
  if (m === 'paidsocial' || m === 'paid_social') return 'Paid Social'

  // 一些常见 source 兜底
  if (s.includes('weixin') || s.includes('wechat')) return 'Social'
  if (s.includes('weibo') || s.includes('zhihu')) return 'Social'

  return 'Other'
}

function detectInAppSource(userAgent = '') {
  const ua = (userAgent || '').toLowerCase()
  // 微信内置浏览器
  if (ua.includes('micromessenger')) {
    // 有些 UA 会带更具体的标识（例如 macwechat / windowswechat）
    if (ua.includes('macwechat')) return 'MacWechat'
    if (ua.includes('windowswechat')) return 'WindowsWechat'
    return 'WeChat'
  }
  // 钉钉内置浏览器（常见 UA: AliApp(DingTalk/..), DingTalk/..）
  if (ua.includes('dingtalk') || ua.includes('aliapp(dingtalk')) return 'DingTalk'
  // QQ / QQ浏览器内置（QQ内置常见标识：qq/、mqqbrowser、qqbrowser）
  if (ua.includes(' qq/') || ua.includes('mqqbrowser') || ua.includes('qqbrowser')) return 'QQ'
  // 微博
  if (ua.includes('weibo')) return 'Weibo'
  // 知乎（ZhihuHybrid）
  if (ua.includes('zhihu')) return 'Zhihu'
  // 抖音 / 今日头条系（常见：aweme、toutiao）
  if (ua.includes('aweme') || ua.includes('douyin')) return 'Douyin'
  if (ua.includes('toutiao')) return 'Toutiao'
  // 小红书（常见：xhs）
  if (ua.includes('xhs') || ua.includes('xiaohongshu')) return 'Xiaohongshu'
  // 飞书/Lark
  if (ua.includes('lark') || ua.includes('feishu')) return 'Feishu'
  // Telegram / WhatsApp（有些会带 app token）
  if (ua.includes('telegram')) return 'Telegram'
  if (ua.includes('whatsapp')) return 'WhatsApp'
  return ''
}

/**
 * 根据优先级生成统一的来源归因
 * Priority 1: UTM
 * Priority 2: User-Agent (client_app)
 * Priority 3: Referrer
 */
function buildSourceAttribution({ params, clientApp, referrer, currentHost }) {
  // UTM 优先
  if (params.utm_source) {
    return {
      source: params.utm_source,
      medium: params.utm_medium || '(not set)',
      channel: channelFromMedium(params.utm_medium, params.utm_source),
      method: 'utm'
    }
  }

  // UA 兜底（微信/钉钉/QQ...）
  if (clientApp) {
    return {
      source: clientApp,
      medium: 'social',
      channel: 'Social',
      method: 'user_agent'
    }
  }

  // Referrer 兜底
  const refHost = getReferrerHost(referrer)
  if (refHost) {
    // 内部跳转
    if (currentHost && refHost === currentHost.toLowerCase()) {
      return {
        source: 'direct',
        medium: '(none)',
        channel: 'Direct',
        method: 'referrer'
      }
    }
    const domainParts = refHost.split('.')
    const mainDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : refHost
    return {
      source: mainDomain.replace(/^www\./, ''),
      medium: 'referral',
      channel: 'Referral',
      method: 'referrer'
    }
  }

  // 全都没有 → Direct
  return {
    source: 'direct',
    medium: '(none)',
    channel: 'Direct',
    method: 'none'
  }
}

function getSessionAttribution() {
  if (typeof window === 'undefined') return {}

  try {
    const existingRaw = sessionStorage.getItem(SESSION_ATTR_KEY)
    if (existingRaw) {
      const parsed = JSON.parse(existingRaw)
      if (parsed && typeof parsed === 'object') {
        // 如果首访是 Direct，但当前 URL 带了 UTM / click id，则用“非直达覆盖直达”
        const cur = parseQueryParamsFromCurrentUrl()
        const hasCampaignNow = Boolean(cur.utm_source || cur.utm_medium || cur.click_id)
        if (hasCampaignNow && parsed.traffic_channel === 'Direct') {
          const currentHost = window.location.hostname || ''
          const referrer = parsed.entryReferrer || document.referrer || ''
          const traffic = classifyTraffic({ referrer, currentHost, ...cur })
          const updated = { ...parsed, ...cur, ...traffic }
          sessionStorage.setItem(SESSION_ATTR_KEY, JSON.stringify(updated))
          return updated
        }
        return parsed
      }
    }

    // 初始化（会话首访）
    const entryUrl = window.location.href
    const entryPath = window.location.pathname
    const entryReferrer = document.referrer || ''
    const entryReferrerHost = getReferrerHost(entryReferrer)
    const currentHost = window.location.hostname || ''
    const entryUserAgent = navigator.userAgent || ''
    const clientApp = detectInAppSource(entryUserAgent) // e.g. MacWechat / WeChat / DingTalk / ...
    const params = parseQueryParamsFromCurrentUrl()
    const traffic = classifyTraffic({ referrer: entryReferrer, currentHost, ...params })
    const sourceAttribution = buildSourceAttribution({
      params,
      clientApp,
      referrer: entryReferrer,
      currentHost
    })

    // 兜底：referrer 为空且无 UTM 时，尝试用 UA 识别 App 内置浏览器来源（微信/钉钉）
    // 这能覆盖“从微信/钉钉直接打开链接，referrer 被剥离”的常见场景
    if (
      (!entryReferrer || entryReferrer === '') &&
      !(params.utm_source || params.utm_medium || params.click_id) &&
      traffic.traffic_channel === 'Direct'
    ) {
      if (clientApp) {
        traffic.traffic_source = clientApp
        traffic.traffic_medium = 'social'
        traffic.traffic_channel = 'Social'
      }
    }

    const attribution = {
      entryUrl,
      entryPath,
      entryReferrer,
      entryReferrerHost,
      entryUserAgent,
      client_app: clientApp,
      source_attribution: sourceAttribution,
      ...params,
      ...traffic,
      attributionVersion: 'v1'
    }

    sessionStorage.setItem(SESSION_ATTR_KEY, JSON.stringify(attribution))
    return attribution
  } catch {
    return {}
  }
}

/**
 * 获取用户唯一标识（从localStorage或生成新ID）
 */
function getUserId() {
  if (typeof window === 'undefined') return null
  
  let userId = localStorage.getItem('tracking_user_id')
  if (!userId) {
    // 生成一个简单的用户ID（基于时间戳和随机数）
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('tracking_user_id', userId)
  }
  return userId
}

/**
 * 获取会话ID（用于识别同一次访问）
 */
function getSessionId() {
  if (typeof window === 'undefined') return null
  
  let sessionId = sessionStorage.getItem('tracking_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('tracking_session_id', sessionId)
  }
  return sessionId
}

/**
 * 获取设备信息
 */
function getDeviceInfo() {
  if (typeof window === 'undefined') return {}
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  }
}

/**
 * 发送埋点数据到后端服务器（AJAX）
 * @param {string} eventType - 事件类型（如 'page_view', 'button_click'）
 * @param {object} eventData - 事件数据
 */
async function trackEvent(eventType, eventData = {}) {
  try {
    const attribution = getSessionAttribution()
    // 构建完整的事件数据
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
      ...eventData // 允许传入额外的自定义数据
    }

    // 在运行时动态获取 API URL
    const API_BASE_URL = getApiBaseUrl()

    // 使用fetch API发送数据（AJAX异步请求）
    const response = await fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trackingData),
      // keepalive确保页面关闭时也能发送请求
      keepalive: true
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('[Tracking] Event sent:', eventType, result)
    
    return result
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('[Tracking] Error sending event:', eventType, error)
    return null
  }
}

/**
 * Vue Composable：在组件中使用埋点功能
 */
export function useTracking() {
  /**
   * 记录页面访问
   * @param {string} pagePath - 页面路径
   * @param {string} pageName - 页面名称
   * @param {string} fromPath - 来源页面路径
   */
  const trackPageView = (pagePath, pageName = '', fromPath = '') => {
    return trackEvent('page_view', {
      page: pagePath,
      pageName: pageName,
      from: fromPath
    })
  }

  /**
   * 记录按钮点击
   * @param {string} buttonName - 按钮名称/标识
   * @param {object} extraData - 额外数据
   */
  const trackButtonClick = (buttonName, extraData = {}) => {
    return trackEvent('button_click', {
      buttonName: buttonName,
      ...extraData
    })
  }

  /**
   * 记录链接点击
   * @param {string} linkUrl - 链接URL
   * @param {string} linkText - 链接文本
   */
  const trackLinkClick = (linkUrl, linkText = '') => {
    return trackEvent('link_click', {
      linkUrl: linkUrl,
      linkText: linkText
    })
  }

  /**
   * 记录自定义事件
   * @param {string} eventType - 事件类型
   * @param {object} eventData - 事件数据
   */
  const trackCustomEvent = (eventType, eventData = {}) => {
    return trackEvent(eventType, eventData)
  }

  /**
   * 记录转化目标（如查看项目详情、点击GitHub链接等）
   * @param {string} goalName - 目标名称
   * @param {object} goalData - 目标相关数据
   */
  const trackConversion = (goalName, goalData = {}) => {
    return trackEvent('conversion', {
      goalName: goalName,
      goalValue: 1,
      ...goalData
    })
  }

  /**
   * 记录滚动深度
   * @param {number} scrollPercent - 滚动百分比（0-100）
   */
  const trackScrollDepth = (scrollPercent) => {
    return trackEvent('scroll_depth', {
      scrollPercent: scrollPercent,
      milestone: getScrollMilestone(scrollPercent)
    })
  }

  /**
   * 记录页面停留时长
   * @param {number} duration - 停留时长（秒）
   */
  const trackTimeOnPage = (duration) => {
    return trackEvent('time_on_page', {
      duration: duration,
      durationFormatted: formatDuration(duration)
    })
  }

  return {
    trackPageView,
    trackButtonClick,
    trackLinkClick,
    trackCustomEvent,
    trackConversion,
    trackScrollDepth,
    trackTimeOnPage,
    trackEvent // 也可以直接使用
  }
}

/**
 * 获取滚动里程碑
 */
function getScrollMilestone(scrollPercent) {
  if (scrollPercent >= 100) return '100%'
  if (scrollPercent >= 75) return '75%'
  if (scrollPercent >= 50) return '50%'
  if (scrollPercent >= 25) return '25%'
  return '0%'
}

/**
 * 格式化时长
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`
}

/**
 * 全局埋点函数（可在非组件环境中使用）
 */

// 全局trackPageView函数（用于路由守卫等非组件环境）
function trackPageView(pagePath, pageName = '', fromPath = '') {
  return trackEvent('page_view', {
    page: pagePath,
    pageName: pageName,
    from: fromPath
  })
}

export { trackEvent, trackPageView }

