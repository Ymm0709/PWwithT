// 前端埋点工具
// 用于收集用户行为数据并通过AJAX发送到后端服务器

// API接口地址配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
      ...eventData // 允许传入额外的自定义数据
    }

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

