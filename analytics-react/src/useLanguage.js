import { useState, useEffect } from 'react'

// 翻译内容
const translations = {
  en: {
    title: 'Analytics Dashboard',
    subtitle: 'Real-time User Behavior Analysis',
    refresh: 'Refresh Data',
    refreshing: 'Refreshing...',
    loading: 'Loading...',
    totalEvents: 'Total Events',
    totalSessions: 'Total Sessions',
    totalConversions: 'Total Conversions',
    conversionRate: 'Conversion Rate',
    avgSessionDuration: 'Avg Session Duration',
    avgPathLength: 'Avg Path Length',
    pagesPerSession: 'pages/session',
    activeUsers: 'Active Users',
    bounceRate: 'Bounce Rate',
    topSecondStepEvent: 'Most Common Action',
    topDropOffTransition: 'Top Drop-off Point',
    noData: 'No data',
    byDate: 'Visit Trend (By Date)',
    byHour: 'Visit Trend (By Hour)',
    eventDistribution: 'Event Type Distribution',
    pageViews: 'Page Views Top 10',
    browserDistribution: 'Browser Distribution',
    platformDistribution: 'Operating System Distribution',
    conversionFunnel: 'Conversion Funnel',
    geoDistribution: 'User Geographic Distribution',
    behaviorFlow: 'User Behavior Flow',
    noGeoData: 'No geographic data available',
    noBehaviorData: 'No behavior flow data',
    noConversionData: 'No conversion data',
    recentEvents: 'Recent Events',
    time: 'Time',
    eventType: 'Event Type',
    pageLabel: 'Page',
    userId: 'User ID',
    sessionId: 'Session ID',
    date: 'By Date',
    hour: 'By Hour',
    eventName: 'Event Count',
    visitCount: 'Visit Count',
    operatingSystem: 'Operating System',
    mobile: 'Mobile Device',
    tablet: 'Tablet Device',
    desktop: 'Desktop Device',
    count: 'Count',
    percentage: 'Percentage',
    dropoff: 'Drop-off',
    from: 'From',
    to: 'To',
    close: 'Close',
    other: 'Other Pages',
    newUsers: 'New Users',
    returningUsers: 'Returning Users',
    newUserCount: 'New Users',
    returningUserCount: 'Returning Users',
    newUserEvents: 'New User Events',
    returningUserEvents: 'Returning User Events',
    newUserSessions: 'New User Sessions',
    returningUserSessions: 'Returning User Sessions',
    newVsReturningUsers: 'New vs Returning Users',
    userTypeComparison: 'User Type Comparison',
    onlineUsers: 'Online Users',
    onlineSessions: 'Online Sessions',
    last5Minutes: 'Last 5 minutes',
    clearData: 'Clear Data',
    clearDataConfirm: 'Clear All Data',
    clearDataWarning: 'This action will permanently delete all tracking data. Please enter the password to confirm.',
    enterPassword: 'Enter password',
    cancel: 'Cancel',
    confirm: 'Confirm',
    clearing: 'Clearing...',
    page: {
      home: 'Home',
      about: 'About Me',
      skills: 'Skills & Resume',
      projects: 'Projects',
      blog: 'Blog',
      links: 'Links',
      analytics: 'Analytics',
      stats: 'Stats',
      unknown: 'Unknown Page',
      projectDetail: 'Project Detail #{id}',
      blogPost: 'Blog Post #{id}'
    },
    event: {
      pageView: 'Page View',
      buttonClick: 'Button Click',
      linkClick: 'Link Click',
      scrollDepth: 'Scroll Depth',
      timeOnPage: 'Time on Page',
      conversion: 'Conversion',
      unknown: 'Unknown Event'
    }
  },
  zh: {
    title: '数据分析仪表盘',
    subtitle: '实时用户行为分析',
    refresh: '刷新数据',
    refreshing: '刷新中...',
    loading: '加载中...',
    totalEvents: '事件总数',
    totalSessions: '会话总数',
    totalConversions: '转化总数',
    conversionRate: '转化率',
    avgSessionDuration: '平均会话时长',
    avgPathLength: '平均路径长度',
    pagesPerSession: '页面/会话',
    activeUsers: '活跃用户',
    bounceRate: '跳出率',
    topSecondStepEvent: '最常见行为',
    topDropOffTransition: '最大流失跳点',
    noData: '暂无数据',
    byDate: '访问趋势（按日期）',
    byHour: '访问趋势（按小时）',
    eventDistribution: '事件类型分布',
    pageViews: '页面访问量 Top 10',
    browserDistribution: '浏览器分布',
    platformDistribution: '操作系统分布',
    conversionFunnel: '转化漏斗',
    geoDistribution: '用户地理位置分布',
    behaviorFlow: '用户行为流',
    noGeoData: '暂无地理位置数据',
    noBehaviorData: '暂无行为流数据',
    noConversionData: '暂无转化数据',
    recentEvents: '最近事件',
    time: '时间',
    eventType: '事件类型',
    pageLabel: '页面',
    userId: '用户ID',
    sessionId: '会话ID',
    date: '按日期',
    hour: '按小时',
    eventName: '事件数量',
    visitCount: '访问量',
    operatingSystem: '操作系统',
    mobile: '移动设备',
    tablet: '平板设备',
    desktop: '桌面设备',
    count: '数量',
    percentage: '占比',
    dropoff: '流失',
    from: '从',
    to: '到',
    close: '关闭',
    other: '其他页面',
    newUsers: '新用户',
    returningUsers: '老用户',
    newUserCount: '新用户数',
    returningUserCount: '老用户数',
    newUserEvents: '新用户事件',
    returningUserEvents: '老用户事件',
    newUserSessions: '新用户会话',
    returningUserSessions: '老用户会话',
    newVsReturningUsers: '新老用户对比',
    userTypeComparison: '用户类型对比',
    onlineUsers: '在线用户',
    onlineSessions: '在线会话',
    last5Minutes: '最近5分钟',
    clearData: '清空数据',
    clearDataConfirm: '清空所有数据',
    clearDataWarning: '此操作将永久删除所有跟踪数据。请输入密码以确认。',
    enterPassword: '请输入密码',
    cancel: '取消',
    confirm: '确认',
    clearing: '清空中...',
    page: {
      home: '首页',
      about: '关于我',
      skills: '技能与简历',
      projects: '项目展示',
      blog: '博客',
      links: '链接',
      analytics: '统计分析',
      stats: '统计',
      unknown: '未知页面',
      projectDetail: '项目详情 #{id}',
      blogPost: '博客文章 #{id}'
    },
    event: {
      pageView: '页面访问',
      buttonClick: '按钮点击',
      linkClick: '链接点击',
      scrollDepth: '滚动深度',
      timeOnPage: '页面停留',
      conversion: '转化完成',
      unknown: '未知事件'
    }
  }
}

export function useLanguage() {
  const getSavedLanguage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('analytics_language') || 'zh'
    }
    return 'zh'
  }

  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('analytics_language', currentLanguage)
    }
  }, [currentLanguage])

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang)
    }
  }

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[currentLanguage]
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k]
      } else {
        return key
      }
    }
    
    // 替换参数
    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(param => {
        value = value.replace(`{${param}}`, params[param])
      })
    }
    
    return value
  }

  return {
    currentLanguage,
    setLanguage,
    toggleLanguage,
    t
  }
}

