// 统计服务器 - 后端API接口定义
// 使用 Express 框架接收前端埋点数据

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  insertEvent,
  queryEvents,
  getAllEvents,
  clearAllEvents,
  getEventCount,
  deleteOldEvents,
  closeDatabase
} from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5707

// 数据存储文件路径（保留用于兼容性，但不再使用）
const DATA_DIR = path.join(__dirname, '../data/tracking')
const STATS_FILE = path.join(DATA_DIR, 'stats.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 中间件配置
// CORS 配置：允许所有来源的跨域请求（生产环境可以限制特定域名）
app.use(cors({
  origin: '*', // 允许所有来源，生产环境可以设置为 ['http://yourdomain.com', 'https://yourdomain.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP'],
  credentials: false // 如果设置为 true，origin 不能是 '*'
}))
app.use(express.json()) // 解析JSON请求体

// 读取存储的事件数据（使用 SQLite）
async function readEvents(filters = {}) {
  try {
    return await queryEvents(filters)
  } catch (error) {
    console.error('Error reading events:', error)
    return []
  }
}

// 写入事件数据（使用 SQLite）
async function writeEvent(event) {
  try {
    const success = await insertEvent(event)
    return success
  } catch (error) {
    console.error('Error writing event:', error)
    return false
  }
}

/**
 * =========================
 * Source Attribution (Server-side, priority-based)
 * =========================
 * 复刻 web_data_analytic 的归因逻辑，把归因放在后端，保证即使前端没带字段也能识别：
 * Priority 1: UTM Parameters (utm_source in URL)
 * Priority 2: User-Agent detection (WeChat / DingTalk / ...)
 * Priority 3: document.referrer analysis (Google/Bing/Direct/Referral...)
 */
function detectClientAppFromUserAgent(userAgent = '') {
  const ua = (userAgent || '').toLowerCase()
  if (ua.includes('micromessenger')) {
    if (ua.includes('macwechat')) return 'MacWechat'
    if (ua.includes('windowswechat')) return 'WindowsWechat'
    return 'WeChat'
  }
  if (ua.includes('dingtalk') || ua.includes('aliapp(dingtalk')) return 'DingTalk'
  if (ua.includes(' qq/') || ua.includes('qq/') || ua.includes('mqqbrowser') || ua.includes('qqbrowser')) return 'QQ'
  if (ua.includes('weibo')) return 'Weibo'
  if (ua.includes('zhihu')) return 'Zhihu'
  if (ua.includes('aweme') || ua.includes('douyin')) return 'Douyin'
  if (ua.includes('toutiao')) return 'Toutiao'
  if (ua.includes('xhs') || ua.includes('xiaohongshu')) return 'Xiaohongshu'
  if (ua.includes('lark') || ua.includes('feishu')) return 'Feishu'
  return ''
}

function normalizeSourceAttribution({ currentUrl = '', referrer = '', userAgent = '' }) {
  // Priority 1: UTM
  try {
    const u = new URL(currentUrl)
    const utmSource = u.searchParams.get('utm_source') || ''
    const utmMedium = u.searchParams.get('utm_medium') || ''
    const utmCampaign = u.searchParams.get('utm_campaign') || ''

    if (utmSource) {
      // 仓库里对部分 utm_source 有固定映射；这里保留原值，并给出常用友好名
      const s = utmSource.toLowerCase()
      const mapped =
        s === 'wechat' ? 'WeChat' :
        s === 'dingtalk' ? 'DingTalk' :
        s === 'google' ? 'Google Search' :
        s === 'bing' ? 'Bing Search' :
        s === 'baidu' ? 'Baidu' :
        utmSource

      return {
        source: mapped,
        medium: utmMedium || '(not set)',
        campaign: utmCampaign || '',
        channel: utmMedium ? (utmMedium.toLowerCase().includes('social') ? 'Social' : 'UTM') : 'UTM',
        method: 'utm'
      }
    }
  } catch {
    // ignore url parse errors
  }

  // Priority 2: User-Agent
  const clientApp = detectClientAppFromUserAgent(userAgent)
  if (clientApp) {
    return {
      source: clientApp,
      medium: 'social',
      campaign: '',
      channel: 'Social',
      method: 'user_agent'
    }
  }

  // Priority 3: Referrer
  if (!referrer) {
    return {
      source: 'Direct Entry',
      medium: '(none)',
      campaign: '',
      channel: 'Direct',
      method: 'none'
    }
  }

  try {
    const ref = new URL(referrer)
    const cur = (() => { try { return new URL(currentUrl) } catch { return null } })()

    // same domain = internal navigation
    if (cur && ref.hostname && cur.hostname && ref.hostname === cur.hostname) {
      return { source: 'Internal', medium: '(none)', campaign: '', channel: 'Direct', method: 'referrer' }
    }

    const host = (ref.hostname || '').toLowerCase()
    if (host.includes('google')) return { source: 'Google Search', medium: 'organic', campaign: '', channel: 'Organic Search', method: 'referrer' }
    if (host.includes('bing')) return { source: 'Bing Search', medium: 'organic', campaign: '', channel: 'Organic Search', method: 'referrer' }
    if (host.includes('baidu')) return { source: 'Baidu', medium: 'organic', campaign: '', channel: 'Organic Search', method: 'referrer' }
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return { source: 'Twitter', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }
    if (host.includes('facebook')) return { source: 'Facebook', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }
    if (host.includes('weibo')) return { source: 'Weibo', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }
    if (host.includes('zhihu')) return { source: 'Zhihu', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }
    if (host.includes('dingtalk')) return { source: 'DingTalk', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }
    if (host.includes('weixin') || host.includes('wechat')) return { source: 'WeChat', medium: 'social', campaign: '', channel: 'Social', method: 'referrer' }

    return { source: host, medium: 'referral', campaign: '', channel: 'Referral', method: 'referrer' }
  } catch {
    return { source: 'Unknown', medium: 'referral', campaign: '', channel: 'Referral', method: 'referrer' }
  }
}

/**
 * 计算行为流（用户浏览路径）
 */
function calculateBehaviorFlow(events) {
  // 按会话分组
  const sessions = {}
  events.forEach(event => {
    if (event.sessionId && event.event === 'page_view') {
      if (!sessions[event.sessionId]) {
        const sa = event.source_attribution || {}
        sessions[event.sessionId] = {
          pages: [],
          referrer: event.referrer || '', // 记录会话的第一个referrer作为访问来源（fallback）
          // 优先使用后端/前端的统一归因字段，其次再 fallback 到旧字段
          sourceAttribution: sa,
          trafficSource: sa.source || event.traffic_source || '', // 兼容旧字段
          trafficChannel: sa.channel || event.traffic_channel || '' // 兼容旧字段
        }
      }
      sessions[event.sessionId].pages.push({
        page: event.page || event.path,
        pageName: event.pageName || '',
        timestamp: event.timestamp,
        from: event.from || ''
      })
      // 如果还没有referrer，使用第一个事件的referrer
      if (!sessions[event.sessionId].referrer && event.referrer) {
        sessions[event.sessionId].referrer = event.referrer
      }
      // 如果还没有trafficSource/trafficChannel，使用第一个有值的事件
      if (!sessions[event.sessionId].trafficSource && event.traffic_source) {
        sessions[event.sessionId].trafficSource = event.traffic_source
      }
      if (!sessions[event.sessionId].trafficChannel && event.traffic_channel) {
        sessions[event.sessionId].trafficChannel = event.traffic_channel
      }
      // 如果还没有 sourceAttribution，用第一个有值的事件
      if (
        (!sessions[event.sessionId].sourceAttribution || !sessions[event.sessionId].sourceAttribution.source) &&
        event.source_attribution &&
        event.source_attribution.source
      ) {
        sessions[event.sessionId].sourceAttribution = event.source_attribution
        sessions[event.sessionId].trafficSource = event.source_attribution.source
        sessions[event.sessionId].trafficChannel = event.source_attribution.channel || sessions[event.sessionId].trafficChannel
      }
    }
  })

  // 分析路径
  const paths = {}
  const transitions = {} // 页面转换关系
  const referrerStats = {} // 访问来源统计
  
  Object.entries(sessions).forEach(([sessionId, sessionData]) => {
    const session = sessionData.pages
    // 按时间排序
    session.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // 统计访问来源（优先使用 source_attribution.source；否则用 referrer 推断）
    const referrer = sessionData.referrer || ''
    const trafficSource = sessionData.trafficSource || ''
    let sourceLabel = trafficSource || '直接访问'

    // 归因结果清理：
    // - Internal 表示同域站内跳转，不应作为“外部来源”节点展示
    // - Direct Entry 与 “直接访问”语义一致，统一为“直接访问”
    if (sourceLabel === 'Internal') sourceLabel = '直接访问'
    if (sourceLabel === 'Direct Entry') sourceLabel = '直接访问'
    
    if (!trafficSource && referrer) {
      try {
        // 判断是否是内部链接 - 如果是，也归类为"直接访问"
        if (referrer.includes('localhost') || referrer.includes('127.0.0.1') || 
            referrer.startsWith('/') || referrer.startsWith('./')) {
          // 内部链接也归类为"直接访问"
          sourceLabel = '直接访问'
        } else {
          // 外部来源：识别常见平台
          try {
            const url = new URL(referrer)
            const hostname = url.hostname.toLowerCase()
            
            // 常见平台映射（添加钉钉）
            const platformMap = {
              'mp.weixin.qq.com': '微信',
              'weixin.qq.com': '微信',
              'www.baidu.com': '百度',
              'baidu.com': '百度',
              'm.baidu.com': '百度',
              'www.google.com': 'Google',
              'google.com': 'Google',
              'www.google.co.uk': 'Google',
              'www.google.co.jp': 'Google',
              'www.bing.com': 'Bing',
              'bing.com': 'Bing',
              'weibo.com': '微博',
              'www.weibo.com': '微博',
              'm.weibo.cn': '微博',
              'zhihu.com': '知乎',
              'www.zhihu.com': '知乎',
              'github.com': 'GitHub',
              'www.github.com': 'GitHub',
              'twitter.com': 'Twitter',
              'www.twitter.com': 'Twitter',
              'x.com': 'Twitter',
              'www.x.com': 'Twitter',
              'facebook.com': 'Facebook',
              'www.facebook.com': 'Facebook',
              'linkedin.com': 'LinkedIn',
              'www.linkedin.com': 'LinkedIn',
              'youtube.com': 'YouTube',
              'www.youtube.com': 'YouTube',
              'reddit.com': 'Reddit',
              'www.reddit.com': 'Reddit',
              // 添加钉钉
              'im.dingtalk.com': '钉钉',
              'oa.dingtalk.com': '钉钉',
              'dingtalk.com': '钉钉',
              'www.dingtalk.com': '钉钉'
            }
            
            // 检查是否是已知平台
            if (platformMap[hostname]) {
              sourceLabel = platformMap[hostname]
            } else {
              // 提取主域名（去掉www和子域名）
              const domainParts = hostname.split('.')
              if (domainParts.length >= 2) {
                const mainDomain = domainParts.slice(-2).join('.')
                sourceLabel = mainDomain.replace(/^www\./, '')
              } else {
                sourceLabel = hostname
              }
            }
          } catch {
            sourceLabel = '外部来源'
          }
        }
      } catch {
        sourceLabel = '外部来源'
      }
    }

    // 再做一次兜底清理（防止上面分支写回 Internal/Direct Entry）
    if (sourceLabel === 'Internal') sourceLabel = '直接访问'
    if (sourceLabel === 'Direct Entry') sourceLabel = '直接访问'
    referrerStats[sourceLabel] = (referrerStats[sourceLabel] || 0) + 1
    
    // 生成路径字符串（包含访问来源）
    const path = session.map(p => p.page).join(' → ')
    paths[path] = (paths[path] || 0) + 1
    
    // 统计页面转换（从访问来源到第一个页面）
    if (session.length > 0) {
      const firstPage = session[0].page || session[0].path
      const entryKey = `${sourceLabel}→${firstPage}`
      transitions[entryKey] = (transitions[entryKey] || 0) + 1
    }
    
    // 统计页面转换
    for (let i = 0; i < session.length - 1; i++) {
      const from = session[i].page || session[i].path
      const to = session[i + 1].page || session[i + 1].path
      const key = `${from}→${to}`
      transitions[key] = (transitions[key] || 0) + 1
    }
  })

  // 转换为数组并排序
  const topPaths = Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))

  return {
    totalSessions: Object.keys(sessions).length,
    topPaths: topPaths,
    averagePathLength: Object.values(sessions).reduce((sum, s) => sum + s.pages.length, 0) / Object.keys(sessions).length || 0,
    transitions: transitions, // 添加转换关系数据（包含访问来源）
    referrerStats: referrerStats, // 访问来源统计
    sessions: Object.values(sessions).map(s => s.pages.map(p => p.page || p.path)) // 添加会话数据供前端使用
  }
}

/**
 * 统计流量渠道（按会话首个 page_view）
 * - 前端若已上报 traffic_channel，则直接使用
 * - 否则：referrer 有值 → Referral；无值 → Direct（粗略兜底）
 */
function calculateTrafficChannels(events) {
  const firstPageViewBySession = {}
  events.forEach(e => {
    if (!e.sessionId || e.event !== 'page_view' || !e.timestamp) return
    const existing = firstPageViewBySession[e.sessionId]
    if (!existing || new Date(e.timestamp) < new Date(existing.timestamp)) {
      firstPageViewBySession[e.sessionId] = e
    }
  })

  const byChannel = {}
  Object.values(firstPageViewBySession).forEach(e => {
    const channel = e.source_attribution?.channel || e.traffic_channel || (e.referrer ? 'Referral' : 'Direct')
    byChannel[channel] = (byChannel[channel] || 0) + 1
  })

  return byChannel
}

/**
 * 计算转化统计
 */
function calculateConversions(events) {
  const conversions = events.filter(e => e.event === 'conversion')
  
  const byGoal = {}
  let totalValue = 0
  
  conversions.forEach(conv => {
    const goalName = conv.goalName || 'unknown'
    byGoal[goalName] = (byGoal[goalName] || 0) + 1
    totalValue += conv.goalValue || 0
  })

  const topGoals = Object.entries(byGoal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([goal, count]) => ({ goal, count }))

  return {
    total: conversions.length,
    totalValue: totalValue,
    byGoal: byGoal,
    topGoals: topGoals
  }
}

/**
 * 计算活跃用户数（独立用户数）
 */
function calculateActiveUsers(events) {
  const uniqueUsers = new Set()
  events.forEach(event => {
    if (event.userId) {
      uniqueUsers.add(event.userId)
    }
  })
  return uniqueUsers.size
}

/**
 * 计算在线用户数（最近5分钟内有活动的用户）
 */
function calculateOnlineUsers(events) {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5分钟前
  
  const onlineUsers = new Set()
  const onlineSessions = new Set()
  
  events.forEach(event => {
    if (event.userId && event.timestamp) {
      const eventTime = new Date(event.timestamp)
      // 如果事件时间在最近5分钟内
      if (eventTime >= fiveMinutesAgo) {
        onlineUsers.add(event.userId)
        if (event.sessionId) {
          onlineSessions.add(event.sessionId)
        }
      }
    }
  })
  
  return {
    count: onlineUsers.size,
    sessions: onlineSessions.size
  }
}

/**
 * 计算新老用户统计
 * 新用户：session第一次出现（新session）
 * 老用户：session之前已经存在过（老session）
 */
async function calculateNewVsReturningUsers(events) {
  // 获取所有历史事件（用于判断session是否首次出现）
  const allEvents = await readEvents()
  
  // 记录每个session在整个历史记录中的第一次出现时间
  const sessionFirstAppearance = {}
  allEvents.forEach(event => {
    if (event.sessionId && event.timestamp) {
      if (!sessionFirstAppearance[event.sessionId]) {
        sessionFirstAppearance[event.sessionId] = event.timestamp
      } else {
        // 保留最早的访问时间
        const existingTime = new Date(sessionFirstAppearance[event.sessionId])
        const currentTime = new Date(event.timestamp)
        if (currentTime < existingTime) {
          sessionFirstAppearance[event.sessionId] = event.timestamp
        }
      }
    }
  })
  
  // 统计当前筛选范围内的事件
  const newUserEvents = []
  const returningUserEvents = []
  const newUserIds = new Set()
  const returningUserIds = new Set()
  
  events.forEach(event => {
    if (event.sessionId && event.timestamp) {
      const sessionFirstTime = sessionFirstAppearance[event.sessionId]
      const currentEventTime = new Date(event.timestamp)
      const firstTime = new Date(sessionFirstTime)
      
      // 如果当前事件的时间就是这个session在整个历史记录中的第一次出现时间（允许1秒误差）
      // 则认为是新用户（新session）；否则是老用户（老session）
      const timeDiff = Math.abs(currentEventTime - firstTime)
      if (timeDiff < 1000) { // 1秒内的误差认为是session的首次出现
        // 新session = 新用户
        newUserEvents.push(event)
        if (event.userId) newUserIds.add(event.userId)
      } else {
        // 老session = 老用户
        returningUserEvents.push(event)
        if (event.userId) returningUserIds.add(event.userId)
      }
    } else {
      // 如果没有sessionId，无法判断，默认归为老用户
      returningUserEvents.push(event)
      if (event.userId) returningUserIds.add(event.userId)
    }
  })
  
  // 计算新老用户的各项指标
  const newUserSessions = new Set()
  const returningUserSessions = new Set()
  
  newUserEvents.forEach(e => {
    if (e.sessionId) newUserSessions.add(e.sessionId)
  })
  
  returningUserEvents.forEach(e => {
    if (e.sessionId) returningUserSessions.add(e.sessionId)
  })
  
  // 计算新老用户的平均会话时长
  const newUserTimeOnPage = newUserEvents.filter(e => e.event === 'time_on_page' && e.duration)
  const returningUserTimeOnPage = returningUserEvents.filter(e => e.event === 'time_on_page' && e.duration)
  
  const newUserAvgDuration = newUserTimeOnPage.length > 0
    ? Math.round(newUserTimeOnPage.reduce((sum, e) => sum + (e.duration || 0), 0) / newUserTimeOnPage.length)
    : 0
  
  const returningUserAvgDuration = returningUserTimeOnPage.length > 0
    ? Math.round(returningUserTimeOnPage.reduce((sum, e) => sum + (e.duration || 0), 0) / returningUserTimeOnPage.length)
    : 0
  
  // 计算新老用户的跳出率
  const newUserBounceRate = calculateBounceRate(newUserEvents)
  const returningUserBounceRate = calculateBounceRate(returningUserEvents)
  
  // 计算新老用户的转化数
  const newUserConversions = newUserEvents.filter(e => e.event === 'conversion').length
  const returningUserConversions = returningUserEvents.filter(e => e.event === 'conversion').length
  
  return {
    newUsers: {
      count: newUserIds.size,
      events: newUserEvents.length,
      sessions: newUserSessions.size,
      avgSessionDuration: newUserAvgDuration,
      bounceRate: newUserBounceRate,
      conversions: newUserConversions,
      conversionRate: newUserSessions.size > 0 
        ? ((newUserConversions / newUserSessions.size) * 100).toFixed(2)
        : '0.00'
    },
    returningUsers: {
      count: returningUserIds.size,
      events: returningUserEvents.length,
      sessions: returningUserSessions.size,
      avgSessionDuration: returningUserAvgDuration,
      bounceRate: returningUserBounceRate,
      conversions: returningUserConversions,
      conversionRate: returningUserSessions.size > 0
        ? ((returningUserConversions / returningUserSessions.size) * 100).toFixed(2)
        : '0.00'
    },
    total: {
      newUsers: newUserIds.size,
      returningUsers: returningUserIds.size,
      totalUsers: newUserIds.size + returningUserIds.size
    }
  }
}

/**
 * 计算跳出率（只有一个事件的会话比例）
 */
function calculateBounceRate(events) {
  // 按会话分组
  const sessions = {}
  events.forEach(event => {
    if (event.sessionId) {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = []
      }
      sessions[event.sessionId].push(event)
    }
  })

  const totalSessions = Object.keys(sessions).length
  if (totalSessions === 0) return 0

  // 计算只有一个事件的会话数（跳出会话）
  let bouncedSessions = 0
  Object.values(sessions).forEach(sessionEvents => {
    // 如果会话中只有1个事件，算作跳出
    if (sessionEvents.length === 1) {
      bouncedSessions++
    }
  })

  // 跳出率 = 跳出会话数 / 总会话数 * 100
  return totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100 * 100) / 100 : 0
}

/**
 * 计算最常见第二步行为（Entry → Next）
 * 用户进入系统后的第二个行为中，出现频率最高的
 */
function calculateTopSecondStepEvent(events) {
  // 按会话分组
  const sessions = {}
  events.forEach(event => {
    if (event.sessionId) {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = []
      }
      sessions[event.sessionId].push(event)
    }
  })

  // 统计每个会话的第二个事件
  const secondStepEvents = {}
  Object.values(sessions).forEach(sessionEvents => {
    // 按时间排序
    sessionEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // 只统计有至少2个事件的会话
    if (sessionEvents.length >= 2) {
      const secondEvent = sessionEvents[1]
      const eventKey = `${secondEvent.event}`
      const pageKey = secondEvent.page || secondEvent.path || 'unknown'
      
      // 创建复合键：事件类型 + 页面路径
      const key = `${eventKey}:${pageKey}`
      
      if (!secondStepEvents[key]) {
        secondStepEvents[key] = {
          event: secondEvent.event,
          page: pageKey,
          count: 0
        }
      }
      secondStepEvents[key].count++
    }
  })

  // 找到最常见的第二步事件
  const entries = Object.values(secondStepEvents)
  if (entries.length === 0) {
    return {
      event: 'unknown',
      page: 'unknown',
      count: 0
    }
  }

  entries.sort((a, b) => b.count - a.count)
  return entries[0]
}

/**
 * 计算最大流失跳点（Drop-off Transition）
 * 在某个 行为 → 下一个行为 的转化中，流失比例最高的那一步
 */
function calculateTopDropOffTransition(events) {
  // 按会话分组
  const sessions = {}
  events.forEach(event => {
    if (event.sessionId) {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = []
      }
      sessions[event.sessionId].push(event)
    }
  })

  // 统计所有跳转（A → B）
  const transitions = {} // { "eventA:pageA → eventB:pageB": { total: 次数, dropoff: 流失次数 } }
  
  Object.values(sessions).forEach(sessionEvents => {
    // 按时间排序
    sessionEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // 遍历每个跳转
    for (let i = 0; i < sessionEvents.length - 1; i++) {
      const fromEvent = sessionEvents[i]
      const toEvent = sessionEvents[i + 1]
      
      const fromKey = `${fromEvent.event}:${fromEvent.page || fromEvent.path || 'unknown'}`
      const toKey = `${toEvent.event}:${toEvent.page || toEvent.path || 'unknown'}`
      const transitionKey = `${fromKey} → ${toKey}`
      
      if (!transitions[transitionKey]) {
        transitions[transitionKey] = {
          fromEvent: fromEvent.event,
          fromPage: fromEvent.page || fromEvent.path || 'unknown',
          toEvent: toEvent.event,
          toPage: toEvent.page || toEvent.path || 'unknown',
          total: 0,
          dropoff: 0
        }
      }
      
      transitions[transitionKey].total++
      
      // 检查是否在 toEvent 之后流失（toEvent 是会话的最后一个事件）
      if (i + 1 === sessionEvents.length - 1) {
        transitions[transitionKey].dropoff++
      }
    }
  })

  // 计算每个跳转的流失率
  const transitionsWithRate = Object.values(transitions)
    .filter(t => t.total > 0)
    .map(t => ({
      ...t,
      dropoffRate: (t.dropoff / t.total) * 100
    }))
    .sort((a, b) => b.dropoffRate - a.dropoffRate) // 按流失率降序排序

  if (transitionsWithRate.length === 0) {
    return {
      fromEvent: 'unknown',
      fromPage: 'unknown',
      toEvent: 'unknown',
      toPage: 'unknown',
      dropoffRate: 0,
      total: 0,
      dropoff: 0
    }
  }

  return transitionsWithRate[0]
}

/**
 * IP到国家映射（同步版本，使用IP段映射）
 * 注意：这是一个简化版本，真实环境应该使用专业的GeoIP数据库
 */
function getCountryFromIp(ip) {
  // 如果是本地IP或内网IP
  if (ip === '127.0.0.1' || ip === '::1' || 
      ip.startsWith('192.168.') || ip.startsWith('10.') || 
      ip.startsWith('172.') || ip.startsWith('169.254.') ||
      ip === 'localhost' || !ip) {
    // 本地IP显示为测试数据，可以随机分配一个国家用于演示
    // 在生产环境中，这些应该被正确识别
    return 'Local'
  }

  // 基于IP段的映射（基于IANA分配的IP段）
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some(isNaN)) {
    return 'Unknown'
  }

  // 基于常见的IP段分配（这只是一个简化的映射）
  // 中国IP段：主要范围
  if ((octets[0] === 1 && octets[1] === 12) || 
      (octets[0] === 14 && octets[1] === 0) ||
      (octets[0] === 27 && octets[1] >= 0 && octets[1] <= 239) ||
      (octets[0] === 36 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 39 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 42 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 49 && octets[1] >= 4 && octets[1] <= 255) ||
      (octets[0] === 58 && octets[1] >= 14 && octets[1] <= 255) ||
      (octets[0] === 59 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 60 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 61 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 101 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 103 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 106 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 110 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 111 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 112 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 113 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 114 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 115 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 116 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 117 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 118 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 119 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 120 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 121 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 122 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 123 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 124 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 125 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 171 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 175 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 180 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 182 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 183 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 202 && octets[1] >= 96 && octets[1] <= 255) ||
      (octets[0] === 203 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 210 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 211 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 218 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 219 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 220 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 221 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 222 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 223 && octets[1] >= 0 && octets[1] <= 223)) {
    return 'CN'
  }

  // 美国IP段（简化）
  if (octets[0] >= 3 && octets[0] <= 126 ||
      (octets[0] === 128 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 129 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 130 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 131 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 132 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 134 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 136 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 137 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 138 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 140 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 141 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 142 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 143 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 144 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 146 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 147 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 148 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 149 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 150 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 152 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 153 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 155 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 156 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 157 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 158 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 159 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 160 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 161 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 162 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 163 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 164 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 165 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 166 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 167 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 168 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 169 && octets[1] >= 0 && octets[1] <= 253) ||
      (octets[0] === 192 && octets[1] >= 0 && octets[1] <= 95) ||
      (octets[0] === 198 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 199 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 204 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 205 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 206 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 207 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 208 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 209 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 216 && octets[1] >= 0 && octets[1] <= 255)) {
    return 'US'
  }

  // 日本
  if ((octets[0] === 126 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 133 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 202 && octets[1] >= 0 && octets[1] <= 95) ||
      (octets[0] === 210 && octets[1] >= 131 && octets[1] <= 255) ||
      (octets[0] === 211 && octets[1] >= 1 && octets[1] <= 255) ||
      (octets[0] === 218 && octets[1] >= 0 && octets[1] <= 255)) {
    return 'JP'
  }

  // 英国
  if ((octets[0] === 2 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 5 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 25 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 31 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 46 && octets[1] >= 32 && octets[1] <= 63) ||
      (octets[0] === 51 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 62 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 77 && octets[1] >= 64 && octets[1] <= 95) ||
      (octets[0] === 79 && octets[1] >= 128 && octets[1] <= 255) ||
      (octets[0] === 80 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 81 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 82 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 83 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 84 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 85 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 86 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 87 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 88 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 89 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 90 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 91 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 92 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 93 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 94 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 95 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 128 && octets[1] >= 86 && octets[1] <= 87) ||
      (octets[0] === 146 && octets[1] >= 176 && octets[1] <= 255)) {
    return 'GB'
  }

  // 德国
  if ((octets[0] === 31 && octets[1] >= 184 && octets[1] <= 255) ||
      (octets[0] === 37 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 46 && octets[1] >= 0 && octets[1] <= 31) ||
      (octets[0] === 62 && octets[1] >= 134 && octets[1] <= 255) ||
      (octets[0] === 77 && octets[1] >= 0 && octets[1] <= 63) ||
      (octets[0] === 78 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 79 && octets[1] >= 0 && octets[1] <= 127) ||
      (octets[0] === 80 && octets[1] >= 64 && octets[1] <= 79) ||
      (octets[0] === 81 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 82 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 83 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 84 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 85 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 87 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 88 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 91 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 93 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 134 && octets[1] >= 93 && octets[1] <= 255) ||
      (octets[0] === 141 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 149 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 188 && octets[1] >= 40 && octets[1] <= 255) ||
      (octets[0] === 194 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 195 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 212 && octets[1] >= 113 && octets[1] <= 255) ||
      (octets[0] === 213 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 217 && octets[1] >= 0 && octets[1] <= 255)) {
    return 'DE'
  }

  // 其他常见国家（简化处理）
  if ((octets[0] === 2 && octets[1] >= 0 && octets[1] <= 15) ||
      (octets[0] === 46 && octets[1] >= 32 && octets[1] <= 47)) return 'FR' // 法国
  if (octets[0] === 133 && octets[1] >= 0 && octets[1] <= 255) return 'KR' // 韩国
  if ((octets[0] === 103 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 106 && octets[1] >= 192 && octets[1] <= 255)) return 'IN' // 印度
  if ((octets[0] === 177 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 179 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 189 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 191 && octets[1] >= 0 && octets[1] <= 255)) return 'BR' // 巴西
  if ((octets[0] === 1 && (octets[1] === 0 || octets[1] === 1)) ||
      (octets[0] === 14 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 27 && octets[1] >= 96 && octets[1] <= 255) ||
      (octets[0] === 43 && octets[1] >= 224 && octets[1] <= 255) ||
      (octets[0] === 49 && octets[1] >= 0 && octets[1] <= 3) ||
      (octets[0] === 58 && octets[1] >= 6 && octets[1] <= 13) ||
      (octets[0] === 60 && octets[1] >= 224 && octets[1] <= 255) ||
      (octets[0] === 103 && octets[1] >= 4 && octets[1] <= 15) ||
      (octets[0] === 110 && octets[1] >= 160 && octets[1] <= 175) ||
      (octets[0] === 113 && octets[1] >= 20 && octets[1] <= 31) ||
      (octets[0] === 115 && octets[1] >= 64 && octets[1] <= 95) ||
      (octets[0] === 118 && octets[1] >= 208 && octets[1] <= 223) ||
      (octets[0] === 120 && octets[1] >= 144 && octets[1] <= 159) ||
      (octets[0] === 121 && octets[1] >= 208 && octets[1] <= 223) ||
      (octets[0] === 122 && octets[1] >= 144 && octets[1] <= 159) ||
      (octets[0] === 124 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 139 && octets[1] >= 130 && octets[1] <= 143) ||
      (octets[0] === 150 && octets[1] >= 101 && octets[1] <= 102) ||
      (octets[0] === 153 && octets[1] >= 102 && octets[1] <= 103) ||
      (octets[0] === 180 && octets[1] >= 92 && octets[1] <= 95) ||
      (octets[0] === 202 && octets[1] >= 10 && octets[1] <= 15) ||
      (octets[0] === 203 && octets[1] >= 26 && octets[1] <= 27) ||
      (octets[0] === 210 && octets[1] >= 1 && octets[1] <= 3) ||
      (octets[0] === 223 && octets[1] >= 252 && octets[1] <= 253)) return 'AU' // 澳大利亚
  if ((octets[0] === 142 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 162 && octets[1] >= 158 && octets[1] <= 159) ||
      (octets[0] === 198 && octets[1] >= 51 && octets[1] <= 54) ||
      (octets[0] === 205 && octets[1] >= 172 && octets[1] <= 175) ||
      (octets[0] === 207 && octets[1] >= 102 && octets[1] <= 103) ||
      (octets[0] === 208 && octets[1] >= 95 && octets[1] <= 95)) return 'CA' // 加拿大
  if ((octets[0] === 46 && octets[1] >= 32 && octets[1] <= 255) ||
      (octets[0] === 5 && octets[1] >= 8 && octets[1] <= 63) ||
      (octets[0] === 31 && octets[1] >= 134 && octets[1] <= 183) ||
      (octets[0] === 37 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 77 && octets[1] >= 88 && octets[1] <= 95) ||
      (octets[0] === 79 && octets[1] >= 140 && octets[1] <= 143) ||
      (octets[0] === 85 && octets[1] >= 26 && octets[1] <= 27) ||
      (octets[0] === 93 && octets[1] >= 158 && octets[1] <= 159) ||
      (octets[0] === 95 && octets[1] >= 84 && octets[1] <= 87) ||
      (octets[0] === 109 && octets[1] >= 72 && octets[1] <= 79) ||
      (octets[0] === 109 && octets[1] >= 207 && octets[1] <= 207) ||
      (octets[0] === 176 && octets[1] >= 56 && octets[1] <= 63) ||
      (octets[0] === 178 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 178 && octets[1] >= 154 && octets[1] <= 159) ||
      (octets[0] === 178 && octets[1] >= 176 && octets[1] <= 191) ||
      (octets[0] === 185 && octets[1] >= 71 && octets[1] <= 71) ||
      (octets[0] === 188 && octets[1] >= 64 && octets[1] <= 127) ||
      (octets[0] === 193 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 213 && octets[1] >= 87 && octets[1] <= 87) ||
      (octets[0] === 217 && octets[1] >= 144 && octets[1] <= 159)) return 'RU' // 俄罗斯
  if ((octets[0] === 5 && octets[1] >= 64 && octets[1] <= 127) ||
      (octets[0] === 46 && octets[1] >= 0 && octets[1] <= 31) ||
      (octets[0] === 62 && octets[1] >= 0 && octets[1] <= 133) ||
      (octets[0] === 79 && octets[1] >= 0 && octets[1] <= 139) ||
      (octets[0] === 80 && octets[1] >= 0 && octets[1] <= 63) ||
      (octets[0] === 82 && octets[1] >= 112 && octets[1] <= 127) ||
      (octets[0] === 87 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 89 && octets[1] >= 32 && octets[1] <= 47) ||
      (octets[0] === 90 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 93 && octets[1] >= 32 && octets[1] <= 95) ||
      (octets[0] === 151 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 155 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 159 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 176 && octets[1] >= 0 && octets[1] <= 55) ||
      (octets[0] === 188 && octets[1] >= 0 && octets[1] <= 39) ||
      (octets[0] === 212 && octets[1] >= 0 && octets[1] <= 112) ||
      (octets[0] === 213 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 217 && octets[1] >= 0 && octets[1] <= 143)) return 'IT' // 意大利
  if ((octets[0] === 2 && octets[1] >= 132 && octets[1] <= 139) ||
      (octets[0] === 5 && octets[1] >= 152 && octets[1] <= 159) ||
      (octets[0] === 37 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 46 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 62 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 77 && octets[1] >= 112 && octets[1] <= 127) ||
      (octets[0] === 79 && octets[1] >= 144 && octets[1] <= 159) ||
      (octets[0] === 80 && octets[1] >= 32 && octets[1] <= 63) ||
      (octets[0] === 81 && octets[1] >= 32 && octets[1] <= 47) ||
      (octets[0] === 82 && octets[1] >= 96 && octets[1] <= 111) ||
      (octets[0] === 83 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 84 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 85 && octets[1] >= 0 && octets[1] <= 25) ||
      (octets[0] === 87 && octets[1] >= 216 && octets[1] <= 223) ||
      (octets[0] === 88 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 89 && octets[1] >= 0 && octets[1] <= 31) ||
      (octets[0] === 90 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 91 && octets[1] >= 216 && octets[1] <= 223) ||
      (octets[0] === 92 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 93 && octets[1] >= 0 && octets[1] <= 31) ||
      (octets[0] === 109 && octets[1] >= 232 && octets[1] <= 239) ||
      (octets[0] === 150 && octets[1] >= 214 && octets[1] <= 215) ||
      (octets[0] === 161 && octets[1] >= 0 && octets[1] <= 255) ||
      (octets[0] === 188 && octets[1] >= 80 && octets[1] <= 95) ||
      (octets[0] === 212 && octets[1] >= 128 && octets[1] <= 143) ||
      (octets[0] === 217 && octets[1] >= 160 && octets[1] <= 175)) return 'ES' // 西班牙
  
  return 'Unknown'
}

/**
 * 计算用户地理位置分布（按用户数量统计，而不是事件数量）
 */
function calculateGeoDistribution(events) {
  // 使用Set来记录每个国家的用户，确保按用户数统计
  const countryUsers = {}
  
  // 只统计有clientIp和userId的事件，确保按用户数统计
  events.forEach(event => {
    if (event.clientIp && event.userId) {
      const country = getCountryFromIp(event.clientIp)
      // 过滤掉本地IP（Local），只显示真实地理位置
      if (country && country !== 'Local') {
        if (!countryUsers[country]) {
          countryUsers[country] = new Set()
        }
        // 使用userId作为唯一标识，Set会自动去重
        countryUsers[country].add(event.userId)
      }
    }
  })
  
  // 转换为用户数量统计
  const geoMap = {}
  Object.keys(countryUsers).forEach(country => {
    geoMap[country] = countryUsers[country].size
  })
  
  // 转换为数组格式，方便前端使用
  const geoData = Object.entries(geoMap)
    .map(([country, count]) => ({ name: country, value: count }))
    .sort((a, b) => b.value - a.value)
  
  return {
    byCountry: geoMap,
    data: geoData
  }
}

// ==================== API接口定义 ====================

/**
 * POST /api/track
 * 接收前端埋点数据
 * 请求体格式：
 * {
 *   "event": "page_view" | "button_click" | "link_click" | ...
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "userId": "user_xxx",
 *   "sessionId": "session_xxx",
 *   "url": "http://localhost:5173/about",
 *   "path": "/about",
 *   "referrer": "",
 *   "device": { ... },
 *   ...其他自定义数据
 * }
 */
app.post('/api/track', async (req, res) => {
  try {
    // 获取客户端IP地址（优先从代理头获取）
    let clientIp = req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip']
    
    if (!clientIp) {
      clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    }
    if (!clientIp) {
      clientIp = req.headers['x-real-ip']
    }
    if (!clientIp) {
      clientIp = req.connection?.remoteAddress || req.socket?.remoteAddress
    }
    // 处理IPv6映射的IPv4地址
    if (clientIp && clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7)
    }
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      // 如果仍然是本地IP，可以尝试从其他头获取
      clientIp = req.ip || '127.0.0.1'
    }
    
    const eventData = {
      ...req.body,
      receivedAt: new Date().toISOString(),
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientIp: clientIp
    }

    // ===== Server-side Source Attribution (UTM > UA > Referrer) =====
    // 复刻参考仓库的逻辑：即使前端没带来源字段，后端也能归因
    const userAgent =
      eventData?.device?.userAgent ||
      req.headers['user-agent'] ||
      ''
    const currentUrl = eventData.url || ''
    const referrer = eventData.referrer || ''
    const sourceAttribution = normalizeSourceAttribution({ currentUrl, referrer, userAgent })

    // 确保 UA 会被持久化到数据库（db.js 只会从 eventData.device.userAgent 写入 device_userAgent 列）
    if (!eventData.device || typeof eventData.device !== 'object') {
      eventData.device = {}
    }
    if (!eventData.device.userAgent && userAgent) {
      eventData.device.userAgent = userAgent
    }

    // 写入统一字段，供后续行为流/统计直接使用
    eventData.source_attribution = sourceAttribution
    // 兼容旧字段（让现有仪表盘/逻辑也能直接显示）
    eventData.client_app = detectClientAppFromUserAgent(userAgent) || eventData.client_app || ''
    eventData.traffic_source = sourceAttribution.source
    eventData.traffic_medium = sourceAttribution.medium
    eventData.traffic_channel = sourceAttribution.channel

    // 验证必要字段
    if (!eventData.event) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: event'
      })
    }

    // 保存事件数据
    const success = await writeEvent(eventData)

    if (success) {
      res.json({
        success: true,
        message: 'Event tracked successfully',
        eventId: eventData.id
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save event'
      })
    }
  } catch (error) {
    console.error('Error in /api/track:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/stats
 * 获取统计数据
 * 查询参数：
 * - event: 事件类型筛选（可选）
 * - startDate: 开始日期（可选）
 * - endDate: 结束日期（可选）
 * - page: 页面路径筛选（可选）
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { event, startDate, endDate, page } = req.query
    const events = await readEvents()

    // 过滤数据
    let filteredEvents = events

    if (event) {
      filteredEvents = filteredEvents.filter(e => e.event === event)
    }

    if (page) {
      filteredEvents = filteredEvents.filter(e => e.page === page || e.path === page)
    }

    if (startDate) {
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= new Date(startDate))
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) <= new Date(endDate))
    }

    // 统计计算
    const stats = {
      total: filteredEvents.length,
      byEvent: {},
      byPage: {},
      byDate: {},
      topPages: [],
      topEvents: [],
      recentEvents: filteredEvents.slice(-10).reverse() // 最近10条
    }

    // 按事件类型统计
    filteredEvents.forEach(e => {
      stats.byEvent[e.event] = (stats.byEvent[e.event] || 0) + 1
    })

    // 按页面统计
    filteredEvents.forEach(e => {
      const pageKey = e.page || e.path || 'unknown'
      stats.byPage[pageKey] = (stats.byPage[pageKey] || 0) + 1
    })

    // 按日期统计
    filteredEvents.forEach(e => {
      const date = new Date(e.timestamp).toISOString().split('T')[0]
      stats.byDate[date] = (stats.byDate[date] || 0) + 1
    })

    // 按小时统计（用于时间序列分析）
    stats.byHour = {}
    filteredEvents.forEach(e => {
      const hour = new Date(e.timestamp).getHours()
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1
    })

    // Top页面
    stats.topPages = Object.entries(stats.byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }))

    // Top事件
    stats.topEvents = Object.entries(stats.byEvent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }))

    // 设备统计（按用户数量统计，而不是事件数量）
    stats.devices = {
      browsers: {},
      platforms: {},
      screenSizes: {},
      languages: {}
    }
    
    // 使用Set来记录每个用户使用的浏览器和平台
    const browserUsers = {}
    const platformUsers = {}
    const screenSizeUsers = {}
    const languageUsers = {}
    
    // 只统计有userId和device的事件，确保按用户数统计
    filteredEvents.forEach(e => {
      if (e.device && e.userId) {
        // 浏览器统计（从userAgent提取）
        const ua = e.device.userAgent || ''
        let browser = 'Unknown'
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
        else if (ua.includes('Firefox')) browser = 'Firefox'
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
        else if (ua.includes('Edg')) browser = 'Edge'
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'
        
        if (!browserUsers[browser]) {
          browserUsers[browser] = new Set()
        }
        // 使用userId作为唯一标识，Set会自动去重
        browserUsers[browser].add(e.userId)

        // 平台统计
        const platform = e.device.platform || 'Unknown'
        if (!platformUsers[platform]) {
          platformUsers[platform] = new Set()
        }
        platformUsers[platform].add(e.userId)

        // 屏幕尺寸统计
        if (e.device.screenWidth && e.device.screenHeight) {
          const size = `${e.device.screenWidth}x${e.device.screenHeight}`
          if (!screenSizeUsers[size]) {
            screenSizeUsers[size] = new Set()
          }
          screenSizeUsers[size].add(e.userId)
        }

        // 语言统计
        const lang = e.device.language || 'Unknown'
        if (!languageUsers[lang]) {
          languageUsers[lang] = new Set()
        }
        languageUsers[lang].add(e.userId)
      }
    })
    
    // 转换为用户数量统计
    Object.keys(browserUsers).forEach(browser => {
      stats.devices.browsers[browser] = browserUsers[browser].size
    })
    
    Object.keys(platformUsers).forEach(platform => {
      stats.devices.platforms[platform] = platformUsers[platform].size
    })
    
    Object.keys(screenSizeUsers).forEach(size => {
      stats.devices.screenSizes[size] = screenSizeUsers[size].size
    })
    
    Object.keys(languageUsers).forEach(lang => {
      stats.devices.languages[lang] = languageUsers[lang].size
    })

    // 行为流分析（用户浏览路径）
    stats.behaviorFlow = calculateBehaviorFlow(filteredEvents)

    // 访问来源/渠道统计（按会话首访）
    // - 来源（Source）：来自 behaviorFlow.referrerStats（已优先使用 traffic_source）
    // - 渠道（Channel）：优先 traffic_channel，否则简单兜底
    stats.traffic = {
      bySource: stats.behaviorFlow.referrerStats || {},
      byChannel: calculateTrafficChannels(filteredEvents)
    }

    // 转化统计
    stats.conversions = calculateConversions(filteredEvents)

    // 计算平均会话时长（基于time_on_page事件）
    const timeOnPageEvents = filteredEvents.filter(e => e.event === 'time_on_page' && e.duration)
    const totalTime = timeOnPageEvents.reduce((sum, e) => sum + (e.duration || 0), 0)
    stats.averageSessionDuration = timeOnPageEvents.length > 0 
      ? Math.round(totalTime / timeOnPageEvents.length) 
      : 0

    // 新增指标：活跃用户数
    stats.activeUsers = calculateActiveUsers(filteredEvents)

    // 新增指标：在线用户数（最近5分钟内有活动的用户）
    // 注意：在线用户需要从所有事件中计算，而不仅仅是筛选后的事件
    const allEvents = await readEvents()
    stats.onlineUsers = calculateOnlineUsers(allEvents)

    // 新增指标：跳出率
    stats.bounceRate = calculateBounceRate(filteredEvents)

    // 新增指标：最常见第二步行为（Entry → Next）
    stats.topSecondStepEvent = calculateTopSecondStepEvent(filteredEvents)

    // 新增指标：最大流失跳点（Drop-off Transition）
    stats.topDropOffTransition = calculateTopDropOffTransition(filteredEvents)

    // 新增指标：用户地理位置分布
    stats.geoDistribution = calculateGeoDistribution(filteredEvents)

    // 新增指标：新老用户统计
    stats.newVsReturningUsers = await calculateNewVsReturningUsers(filteredEvents)

    res.json({
      success: true,
      stats,
      filters: { event, startDate, endDate, page }
    })
  } catch (error) {
    console.error('Error in /api/stats:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * DELETE /api/clear-data
 * 清空所有数据（需要密码验证）
 * 请求体：{ "password": "..." }
 */
app.delete('/api/clear-data', async (req, res) => {
  try {
    const { password } = req.body
    
    // 高难度密码：githiH-jothoz-qyfzo8
    const correctPassword = 'githiH-jothoz-qyfzo8'
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: '密码不能为空'
      })
    }
    
    if (password !== correctPassword) {
      return res.status(401).json({
        success: false,
        error: '密码错误'
      })
    }
    
    // 清空数据库
    try {
      await clearAllEvents()
      console.log('✅ 所有数据已清空')
      
      res.json({
        success: true,
        message: '所有数据已成功清空'
      })
    } catch (error) {
      console.error('清空数据时出错:', error)
      res.status(500).json({
        success: false,
        error: '清空数据失败'
      })
    }
  } catch (error) {
    console.error('Error in /api/clear-data:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/events
 * 获取原始事件列表（用于调试）
 */
app.get('/api/events', async (req, res) => {
  try {
    const { limit = 100, event, page } = req.query
    let events = await readEvents()

    // 过滤
    if (event) {
      events = events.filter(e => e.event === event)
    }
    if (page) {
      events = events.filter(e => e.page === page || e.path === page)
    }

    // 限制数量并反转（最新的在前）
    events = events.slice(-parseInt(limit)).reverse()

    res.json({
      success: true,
      events,
      total: await getEventCount()
    })
  } catch (error) {
    console.error('Error in /api/events:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// API根路径 - 显示可用端点
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Tracking API Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/track': '接收埋点数据',
      'GET /api/stats': '获取统计数据',
      'GET /api/events': '获取事件列表',
      'GET /api/health': '健康检查'
    },
    usage: {
      track: 'POST /api/track - 发送用户行为数据',
      stats: 'GET /api/stats?event=page_view&page=/about - 查询统计数据',
      events: 'GET /api/events?limit=50 - 获取最近的事件',
      health: 'GET /api/health - 检查服务器状态'
    }
  })
})

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tracking server is running',
    timestamp: new Date().toISOString()
  })
})

// 提供追踪脚本
app.get('/tracking.js', (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../public/tracking.js')
    const trackingScript = fs.readFileSync(scriptPath, 'utf8')
    res.setHeader('Content-Type', 'application/javascript')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(trackingScript)
  } catch (error) {
    console.error('Error serving /tracking.js:', error)
    res.status(500).send('// Failed to load tracking.js')
  }
})

// 根路径 - 重定向到 API 信息
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tracking API Server',
    version: '1.0.0',
    apiBase: '/api',
    endpoints: {
      'GET /api': '查看所有可用端点',
      'POST /api/track': '接收埋点数据',
      'GET /api/stats': '获取统计数据',
      'GET /api/events': '获取事件列表',
      'GET /api/health': '健康检查'
    },
    quickStart: {
      viewEndpoints: '访问 http://localhost:5707/api 查看所有端点',
      trackEvent: 'POST http://localhost:5707/api/track',
      viewStats: 'GET http://localhost:5707/api/stats',
      healthCheck: 'GET http://localhost:5707/api/health'
    }
  })
})

// 404 处理 - 未定义的路径
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `路径 ${req.method} ${req.path} 不存在`,
    availableEndpoints: {
      'GET /': '服务器信息',
      'GET /api': 'API端点列表',
      'POST /api/track': '接收埋点数据',
      'GET /api/stats': '获取统计数据',
      'GET /api/events': '获取事件列表',
      'GET /api/health': '健康检查'
    },
    tip: '访问 http://localhost:5707/api 查看所有可用端点'
  })
})

// 启动服务器
// 监听 0.0.0.0 以允许外部访问
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📊 Tracking Server is running on http://0.0.0.0:${PORT}`)
  console.log(`📈 API endpoints:`)
  console.log(`   GET  / - 服务器信息`)
  console.log(`   GET  /api - API端点列表`)
  console.log(`   POST /api/track - 接收埋点数据`)
  console.log(`   GET  /api/stats - 获取统计数据`)
  console.log(`   GET  /api/events - 获取事件列表`)
  console.log(`   GET  /api/health - 健康检查`)
  console.log(`💾 使用 SQLite 数据库存储事件数据`)
})

// 优雅关闭：在进程退出时关闭数据库连接
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...')
  closeDatabase()
  process.exit(0)
})


