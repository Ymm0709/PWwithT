// 页面级别的追踪功能
// 自动追踪页面停留时长和滚动深度

import { onMounted, onBeforeUnmount } from 'vue'
import { useTracking } from './useTracking'

/**
 * 页面追踪 Composable
 * 自动追踪页面停留时长和滚动深度
 */
export function usePageTracking() {
  const { trackTimeOnPage, trackScrollDepth } = useTracking()
  
  let startTime = null
  let scrollTracked = {
    25: false,
    50: false,
    75: false,
    100: false
  }

  /**
   * 追踪滚动深度
   */
  const handleScroll = () => {
    if (typeof window === 'undefined') return

    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    
    // 计算滚动百分比
    const scrollPercent = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    )

    // 追踪里程碑（25%, 50%, 75%, 100%）
    if (scrollPercent >= 25 && !scrollTracked[25]) {
      trackScrollDepth(25)
      scrollTracked[25] = true
    }
    if (scrollPercent >= 50 && !scrollTracked[50]) {
      trackScrollDepth(50)
      scrollTracked[50] = true
    }
    if (scrollPercent >= 75 && !scrollTracked[75]) {
      trackScrollDepth(75)
      scrollTracked[75] = true
    }
    if (scrollPercent >= 100 && !scrollTracked[100]) {
      trackScrollDepth(100)
      scrollTracked[100] = true
    }
  }

  /**
   * 追踪页面停留时长
   */
  const trackPageTime = () => {
    if (startTime) {
      const duration = Math.round((Date.now() - startTime) / 1000) // 转换为秒
      if (duration > 0) {
        trackTimeOnPage(duration)
      }
    }
  }

  // 页面可见性变化时追踪
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面隐藏时记录停留时长
      trackPageTime()
    } else {
      // 页面重新可见时重置开始时间
      startTime = Date.now()
    }
  }

  // 页面卸载时追踪
  const handleBeforeUnload = () => {
    trackPageTime()
  }

  onMounted(() => {
    startTime = Date.now()
    
    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 添加页面卸载监听
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    // 清理事件监听
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    
    // 记录最终停留时长
    trackPageTime()
  })

  return {
    // 可以手动触发追踪
    trackScroll: handleScroll,
    trackTime: trackPageTime
  }
}

