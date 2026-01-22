import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import './App.css'
import { useLanguage } from './useLanguage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5707/api'

// 页面路径到可读名称的映射（支持多语言）
const getPageLabel = (path, t) => {
  const pageMap = {
    '/': t('page.home'),
    '/about': t('page.about'),
    '/skills': t('page.skills'),
    '/projects': t('page.projects'),
    '/blog': t('page.blog'),
    '/links': t('page.links'),
    '/analytics': t('page.analytics'),
    '/stats': t('page.stats'),
    'unknown': t('page.unknown')
  }
  
  if (path && path.startsWith('/projects/')) {
    const id = path.split('/projects/')[1]
    return t('page.projectDetail', { id })
  }
  
  if (path && path.startsWith('/blog/')) {
    const id = path.split('/blog/')[1]
    return t('page.blogPost', { id })
  }
  
  return pageMap[path] || path || t('page.unknown')
}

// 事件类型到可读名称的映射（支持多语言）
const getEventLabel = (event, t) => {
  const eventMap = {
    'page_view': t('event.pageView'),
    'button_click': t('event.buttonClick'),
    'link_click': t('event.linkClick'),
    'scroll_depth': t('event.scrollDepth'),
    'time_on_page': t('event.timeOnPage'),
    'conversion': t('event.conversion')
  }
  return eventMap[event] || event || t('event.unknown')
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// 格式化时长（秒）
const formatDuration = (seconds) => {
  if (!seconds) return '0秒'
  if (seconds < 60) return `${Math.round(seconds)}秒`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}分${secs}秒`
}

function App() {
  const { currentLanguage, toggleLanguage, t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('date') // 'date' or 'hour'
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearPassword, setClearPassword] = useState('')
  const [clearing, setClearing] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/stats`)
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      if (json.success && json.stats) {
        setStats(json.stats)
        setError(null)
      } else {
        throw new Error(json.error || '数据格式错误')
      }
    } catch (e) {
      console.error('获取数据失败:', e)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // 每30秒自动刷新（静默刷新，不显示加载状态）
    const interval = setInterval(() => {
      // 静默刷新，不显示loading状态，直接更新数据
      fetch(`${API_BASE_URL}/stats`)
        .then(res => {
          if (!res.ok) return
          return res.json()
        })
        .then(json => {
          if (json.success && json.stats) {
            setStats(json.stats)
            setError(null)
          }
        })
        .catch(e => {
          // 静默失败，不影响用户体验
          console.error('自动刷新失败:', e)
        })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // 清空所有数据
  const handleClearData = async () => {
    if (!clearPassword) {
      setError('请输入密码')
      return
    }

    setClearing(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/clear-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: clearPassword })
      })

      const json = await res.json()

      if (json.success) {
        setShowClearDialog(false)
        setClearPassword('')
        setError(null)
        // 清空后刷新数据
        await fetchStats()
        alert('所有数据已成功清空')
      } else {
        setError(json.error || '清空数据失败')
      }
    } catch (e) {
      console.error('清空数据失败:', e)
      setError(e?.message || '清空数据失败')
    } finally {
      setClearing(false)
    }
  }

  // KPI指标计算
  const kpis = {
    totalEvents: stats?.total || 0,
    totalSessions: stats?.behaviorFlow?.totalSessions || 0,
    totalConversions: stats?.conversions?.total || 0,
    avgSessionDuration: stats?.averageSessionDuration || 0,
    avgPathLength: Math.round(stats?.behaviorFlow?.averagePathLength || 0),
    conversionRate: stats?.behaviorFlow?.totalSessions > 0
      ? ((stats?.conversions?.total / stats?.behaviorFlow?.totalSessions) * 100).toFixed(2)
      : '0.00',
    // 新增指标
    activeUsers: stats?.activeUsers || 0,
    bounceRate: stats?.bounceRate || 0,
    topSecondStepEvent: stats?.topSecondStepEvent || null,
    topDropOffTransition: stats?.topDropOffTransition || null,
    // 在线用户指标
    onlineUsers: stats?.onlineUsers || { count: 0, sessions: 0 }
  }

  // 时间序列图配置
  const getTimeSeriesOption = () => {
    if (!stats) return {}
    
    let data
    const hasData = timeRange === 'date' 
      ? (stats?.byDate && Object.keys(stats.byDate).length > 0)
      : (stats?.byHour && Object.keys(stats.byHour).length > 0)
    
    if (hasData) {
      data = timeRange === 'date' 
        ? (() => {
            const dates = Object.keys(stats.byDate).sort()
            const values = dates.map(date => stats.byDate[date])
            return { dates, values }
          })()
        : (() => {
            const hours = Array.from({ length: 24 }, (_, i) => i)
            const values = hours.map(h => stats.byHour[h] || 0)
            const dates = hours.map(h => `${h}:00`)
            return { dates, values }
          })()
    } else {
      // 没有数据时返回空数组
      data = { dates: [], values: [] }
    }
    
    return {
      title: {
        text: timeRange === 'date' ? `📈 ${t('byDate')}` : `📈 ${t('byHour')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9' },
        axisPointer: {
          type: 'cross',
          label: { backgroundColor: '#334155' }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data?.dates || [],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      },
      series: [{
        name: t('eventName'),
        type: 'line',
        smooth: true,
        data: data.values,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#06b6d4', width: 3 },
        itemStyle: { color: '#06b6d4' },
        emphasis: {
          focus: 'series'
        }
      }]
    }
  }

  // 事件分布图配置（饼图）
  const getEventDistributionOption = () => {
    if (!stats?.byEvent || Object.keys(stats.byEvent).length === 0) {
      return {}
    }
    
    const data = Object.entries(stats.byEvent)
      .map(([event, count]) => ({
        name: getEventLabel(event, t),
        value: count
      }))
      .sort((a, b) => b.value - a.value)
    
    return {
      title: {
        text: `🎯 ${t('eventDistribution')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: '#cbd5e1', fontSize: 12 },
        itemGap: 12,
        itemWidth: 14,
        itemHeight: 14
      },
      series: [{
        name: t('eventType'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2
        },
        label: {
          show: true,
          color: '#cbd5e1',
          fontSize: 11,
          formatter: (params) => {
            // 只显示占比大于5%的标签，避免标签过多
            if (params.percent < 5) {
              return ''
            }
            return `${params.name}\n${params.percent}%`
          },
          position: 'outside',
          distanceToLabelLine: 5
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: {
            color: '#94a3b8',
            width: 1
          }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(6, 182, 212, 0.5)'
          }
        },
        data: data
      }]
    }
  }

  // 页面访问量柱状图配置
  const getPageViewsOption = () => {
    if (!stats?.byPage || Object.keys(stats.byPage).length === 0) {
      return {}
    }
    
    const data = Object.entries(stats.byPage)
      .map(([page, count]) => ({
        name: getPageLabel(page, t),
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    
    return {
      title: {
        text: `📄 ${t('pageViews')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        inverse: true,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      series: [{
        name: t('visitCount'),
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#06b6d4' },
              { offset: 1, color: '#6366f1' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#cbd5e1',
          fontSize: 11
        }
      }]
    }
  }

  // 浏览器分布图
  const getBrowserDistributionOption = () => {
    if (!stats?.devices?.browsers) return {}
    
    const data = Object.entries(stats.devices.browsers)
      .map(([browser, count]) => ({ name: browser, value: count }))
      .sort((a, b) => b.value - a.value)
    
    return {
      title: {
        text: `🌐 ${t('browserDistribution')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
        formatter: '{b}: {c} ({d}%)'
      },
      series: [{
        name: t('browserDistribution'),
        type: 'pie',
        radius: '60%',
        data: data,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2
        },
        label: {
          color: '#cbd5e1',
          fontSize: 12
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(6, 182, 212, 0.5)'
          }
        }
      }]
    }
  }

  // 平台分布图（Bar with Background）
  const getPlatformDistributionOption = () => {
    if (!stats?.devices?.platforms) return {}
    
    // 平台名称映射（简化显示）
    const platformNameMap = {
      'MacIntel': 'Mac',
      'Win32': 'Windows',
      'iPhone': 'iPhone',
      'iPad': 'iPad',
      'Android': 'Android'
    }
    
    const data = Object.entries(stats.devices.platforms)
      .map(([platform, count]) => ({ 
        name: platformNameMap[platform] || platform, 
        originalName: platform,
        value: count 
      }))
      .sort((a, b) => b.value - a.value)
    
    const maxValue = Math.max(...data.map(d => d.value), 1)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    
    // 判断设备类型（根据原始平台名称）
    const getDeviceType = (platform) => {
      // 使用原始平台名称判断
      const dataItem = data.find(d => d.name === platform)
      const originalPlatform = dataItem?.originalName || platform
      const platformLower = originalPlatform.toLowerCase()
      if (platformLower.includes('iphone') || platformLower.includes('android') || platformLower.includes('mobile')) {
        return `📱 ${t('mobile')}`
      } else if (platformLower.includes('ipad') || platformLower.includes('tablet')) {
        return `📱 ${t('tablet')}`
      } else {
        return `💻 ${t('desktop')}`
      }
    }
    
    return {
      title: {
        text: `💻 ${t('platformDistribution')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9' },
        axisPointer: {
          type: 'shadow'
        },
          formatter: (params) => {
            const param = params[0]
            const percentage = total > 0 ? ((param.value / total) * 100).toFixed(1) : 0
            return `${param.name}<br/>${t('count')}: ${param.value}<br/>${t('percentage')}: ${percentage}%`
          }
      },
      grid: {
        left: '15%',
        right: '8%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 12,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      },
      series: [
        // 背景条（显示最大值）
        {
          name: '最大值',
          type: 'bar',
          data: data.map(() => maxValue),
          itemStyle: {
            color: 'rgba(51, 65, 85, 0.3)',
            borderRadius: [4, 4, 0, 0]
          },
          barGap: '-100%',
          silent: true,
          z: 1
        },
        // 实际数据条
        {
          name: t('operatingSystem'),
          type: 'bar',
          data: data.map(d => d.value),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#06b6d4' },
                { offset: 1, color: '#6366f1' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: '#cbd5e1',
            fontSize: 11,
            formatter: (params) => {
              const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
              return `${params.value} (${percentage}%)`
            }
          },
          z: 2
        }
      ]
    }
  }


  // 获取国旗emoji（基于国家代码）
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'US': '🇺🇸', 'CN': '🇨🇳', 'JP': '🇯🇵', 'GB': '🇬🇧', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'KR': '🇰🇷', 'IN': '🇮🇳', 'BR': '🇧🇷', 'AU': '🇦🇺',
      'CA': '🇨🇦', 'RU': '🇷🇺', 'IT': '🇮🇹', 'ES': '🇪🇸', 'MX': '🇲🇽',
      'NL': '🇳🇱', 'SE': '🇸🇪', 'CH': '🇨🇭', 'SG': '🇸🇬', 'HK': '🇭🇰',
      'TW': '🇹🇼', 'NZ': '🇳🇿', 'ZA': '🇿🇦', 'AR': '🇦🇷', 'ID': '🇮🇩',
      'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'MY': '🇲🇾', 'BD': '🇧🇩',
      'PK': '🇵🇰', 'TR': '🇹🇷', 'EG': '🇪🇬', 'SA': '🇸🇦', 'AE': '🇦🇪',
      'IL': '🇮🇱', 'PL': '🇵🇱', 'BE': '🇧🇪', 'AT': '🇦🇹', 'NO': '🇳🇴',
      'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷',
      'CZ': '🇨🇿', 'RO': '🇷🇴', 'HU': '🇭🇺', 'UA': '🇺🇦', 'CL': '🇨🇱',
      'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪', 'EC': '🇪🇨'
    }
    return flagMap[countryCode] || '🌍'
  }

  // 用户地理位置分布（动态排序柱状图）
  const getWorldMapOption = () => {
    if (!stats?.geoDistribution?.data || stats.geoDistribution.data.length === 0) {
      return {
        title: {
          text: `🌍 ${t('geoDistribution')}`,
          left: 'center',
          textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: t('noGeoData'),
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 16
          }
        }
      }
    }

    // 国家代码到显示名称的映射（支持中英文，包含更多国家）
    const getCountryName = (code) => {
      const names = {
        'US': { zh: '美国', en: 'United States' },
        'CN': { zh: '中国', en: 'China' },
        'JP': { zh: '日本', en: 'Japan' },
        'GB': { zh: '英国', en: 'United Kingdom' },
        'DE': { zh: '德国', en: 'Germany' },
        'FR': { zh: '法国', en: 'France' },
        'KR': { zh: '韩国', en: 'South Korea' },
        'IN': { zh: '印度', en: 'India' },
        'BR': { zh: '巴西', en: 'Brazil' },
        'AU': { zh: '澳大利亚', en: 'Australia' },
        'CA': { zh: '加拿大', en: 'Canada' },
        'RU': { zh: '俄罗斯', en: 'Russia' },
        'IT': { zh: '意大利', en: 'Italy' },
        'ES': { zh: '西班牙', en: 'Spain' },
        'MX': { zh: '墨西哥', en: 'Mexico' },
        'NL': { zh: '荷兰', en: 'Netherlands' },
        'SE': { zh: '瑞典', en: 'Sweden' },
        'CH': { zh: '瑞士', en: 'Switzerland' },
        'SG': { zh: '新加坡', en: 'Singapore' },
        'HK': { zh: '香港', en: 'Hong Kong' },
        'TW': { zh: '台湾', en: 'Taiwan' },
        'NZ': { zh: '新西兰', en: 'New Zealand' },
        'ZA': { zh: '南非', en: 'South Africa' },
        'AR': { zh: '阿根廷', en: 'Argentina' },
        'ID': { zh: '印度尼西亚', en: 'Indonesia' },
        'TH': { zh: '泰国', en: 'Thailand' },
        'VN': { zh: '越南', en: 'Vietnam' },
        'PH': { zh: '菲律宾', en: 'Philippines' },
        'MY': { zh: '马来西亚', en: 'Malaysia' },
        'BD': { zh: '孟加拉', en: 'Bangladesh' },
        'PK': { zh: '巴基斯坦', en: 'Pakistan' },
        'TR': { zh: '土耳其', en: 'Turkey' },
        'EG': { zh: '埃及', en: 'Egypt' },
        'SA': { zh: '沙特阿拉伯', en: 'Saudi Arabia' },
        'AE': { zh: '阿联酋', en: 'UAE' },
        'IL': { zh: '以色列', en: 'Israel' },
        'PL': { zh: '波兰', en: 'Poland' },
        'BE': { zh: '比利时', en: 'Belgium' },
        'AT': { zh: '奥地利', en: 'Austria' },
        'NO': { zh: '挪威', en: 'Norway' },
        'DK': { zh: '丹麦', en: 'Denmark' },
        'FI': { zh: '芬兰', en: 'Finland' },
        'IE': { zh: '爱尔兰', en: 'Ireland' },
        'PT': { zh: '葡萄牙', en: 'Portugal' },
        'GR': { zh: '希腊', en: 'Greece' },
        'CZ': { zh: '捷克', en: 'Czech Republic' },
        'RO': { zh: '罗马尼亚', en: 'Romania' },
        'HU': { zh: '匈牙利', en: 'Hungary' },
        'UA': { zh: '乌克兰', en: 'Ukraine' },
        'CL': { zh: '智利', en: 'Chile' },
        'CO': { zh: '哥伦比亚', en: 'Colombia' },
        'PE': { zh: '秘鲁', en: 'Peru' },
        'VE': { zh: '委内瑞拉', en: 'Venezuela' },
        'EC': { zh: '厄瓜多尔', en: 'Ecuador' }
      }
      const name = names[code]
      if (name) {
        return currentLanguage === 'zh' ? name.zh : name.en
      }
      // 如果不在映射中，返回国家代码
      return code
    }

    // 准备数据，过滤掉"Local"和"Unknown"，只显示实际有数据的国家
    const data = stats.geoDistribution.data
      .filter(item => item.name !== 'Local' && item.name !== 'Unknown' && item.value > 0)
      .map(item => ({
        name: getCountryName(item.name),
        value: item.value,
        code: item.name,
        flag: getCountryFlag(item.name)
      }))
      .sort((a, b) => b.value - a.value)

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const maxValue = Math.max(...data.map(d => d.value), 1)

    return {
      title: {
        text: `🌍 ${t('geoDistribution')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9' },
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const param = params[0]
          const dataItem = data.find(d => d.name === param.name)
          const percentage = total > 0 ? ((param.value / total) * 100).toFixed(1) : 0
          return `${dataItem?.flag || ''} ${param.name}<br/>${t('count')}: ${param.value}<br/>${t('percentage')}: ${percentage}%`
        }
      },
      grid: {
        top: '18%',
        bottom: 30,
        left: 150,
        right: 80
      },
      xAxis: {
        type: 'value',
        max: 'dataMax',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 12,
          formatter: (n) => Math.round(n) + ''
        },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: data.map(d => d.name),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: {
          show: true,
          fontSize: 14,
          color: '#cbd5e1',
          formatter: (value) => {
            const dataItem = data.find(d => d.name === value)
            return value + '{flag|' + (dataItem?.flag || '🌍') + '}'
          },
          rich: {
            flag: {
              fontSize: 20,
              padding: 5
            }
          }
        },
        animationDuration: 300,
        animationDurationUpdate: 300
      },
      series: [
        // 背景条（显示最大值）
        {
          name: '最大值',
          type: 'bar',
          data: data.map(() => maxValue),
          itemStyle: {
            color: 'rgba(51, 65, 85, 0.3)',
            borderRadius: [0, 4, 4, 0]
          },
          barGap: '-100%',
          silent: true,
          z: 1
        },
        // 实际数据条（支持动态排序）
        {
          name: t('geoDistribution'),
          type: 'bar',
          realtimeSort: true,
          data: data.map(d => d.value),
          itemStyle: {
            color: (params) => {
              // 为每个国家分配不同的颜色
              const colorPalette = [
                '#6366f1', // 紫色
                '#06b6d4', // 青色
                '#10b981', // 绿色
                '#f59e0b', // 橙色
                '#ef4444', // 红色
                '#8b5cf6', // 紫罗兰
                '#ec4899', // 粉色
                '#14b8a6', // 青绿色
                '#f97316', // 橙红色
                '#84cc16', // 黄绿色
                '#3b82f6', // 蓝色
                '#a855f7', // 紫色
                '#06b6d4', // 青色
                '#22c55e', // 绿色
                '#eab308', // 黄色
                '#f43f5e', // 玫瑰红
                '#0ea5e9', // 天蓝色
                '#6366f1', // 靛蓝色
                '#8b5cf6', // 紫色
                '#ec4899'  // 粉红色
              ]
              // 根据国家代码生成一个稳定的颜色索引
              const dataItem = data[params.dataIndex]
              const countryCode = dataItem?.code || ''
              // 使用国家代码的字符码来生成稳定的颜色索引
              let hash = 0
              for (let i = 0; i < countryCode.length; i++) {
                hash = countryCode.charCodeAt(i) + ((hash << 5) - hash)
              }
              const colorIndex = Math.abs(hash) % colorPalette.length
              return colorPalette[colorIndex]
            },
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            precision: 0,
            position: 'right',
            valueAnimation: true,
            color: '#cbd5e1',
            fontSize: 12,
            fontFamily: 'monospace',
            formatter: (params) => {
              const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
              return `${params.value} (${percentage}%)`
            }
          },
          z: 2
        }
      ],
      animationDuration: 0,
      animationDurationUpdate: 1000,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut'
    }
  }

  // 检测并移除Sankey图中的循环，确保是DAG（有向无环图）
  const removeCycles = (links, nodeCount) => {
    if (!links || links.length === 0 || !nodeCount) return []
    
    // 第一步：合并相同方向的边
    const edgeMap = new Map()
    links.forEach(link => {
      const source = parseInt(link.source)
      const target = parseInt(link.target)
      
      // 验证节点索引有效性
      if (isNaN(source) || isNaN(target) || source < 0 || source >= nodeCount || 
          target < 0 || target >= nodeCount || source === target) {
        return // 跳过无效边
      }
      
      const key = `${source}→${target}`
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { source, target, value: link.value })
      } else {
        edgeMap.get(key).value += link.value
      }
    })
    
    // 第二步：处理直接反向边（A→B 和 B→A），保留流量更大的
    const processedEdges = []
    const bidirectionalPairs = new Set()
    
    edgeMap.forEach((link, key) => {
      const reverseKey = `${link.target}→${link.source}`
      const pairKey = [link.source, link.target].sort().join('|')
      
      // 如果已经处理过这个节点对，跳过
      if (bidirectionalPairs.has(pairKey)) {
        return
      }
      
      // 检查是否存在反向边
      if (edgeMap.has(reverseKey)) {
        const reverseLink = edgeMap.get(reverseKey)
        // 保留流量更大的边
        if (link.value >= reverseLink.value) {
          processedEdges.push(link)
        } else {
          processedEdges.push(reverseLink)
        }
        bidirectionalPairs.add(pairKey)
      } else {
        // 没有反向边，先加入候选列表
        processedEdges.push(link)
      }
    })
    
    // 第三步：使用贪心算法移除复杂循环
    // 按流量从大到小排序，优先保留流量大的边
    processedEdges.sort((a, b) => b.value - a.value)
    
    const resultLinks = []
    const graph = new Array(nodeCount).fill(null).map(() => [])
    
    // 检查添加边是否会形成循环
    const wouldCreateCycle = (source, target) => {
      // 如果 source === target，直接形成自环
      if (source === target) return true
      
      // 使用 BFS 检查从 target 是否能到达 source
      const visited = new Set()
      const queue = [target]
      visited.add(target)
      
      while (queue.length > 0) {
        const node = queue.shift()
        
        for (const neighbor of graph[node] || []) {
          if (neighbor === source) {
            return true // 发现循环路径
          }
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        }
      }
      
      return false
    }
    
    // 逐个添加边，跳过会形成循环的边
    processedEdges.forEach(link => {
      if (!wouldCreateCycle(link.source, link.target)) {
        graph[link.source].push(link.target)
        resultLinks.push({
          source: link.source,
          target: link.target,
          value: link.value
        })
      }
    })
    
    return resultLinks
  }

  // 新老用户对比图配置
  const getNewVsReturningUsersOption = () => {
    if (!stats?.newVsReturningUsers) {
      return {
        title: {
          text: `👥 ${t('newVsReturningUsers')}`,
          left: 'center',
          textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: t('noData'),
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 16
          }
        }
      }
    }

    const newUsers = stats.newVsReturningUsers.newUsers
    const returningUsers = stats.newVsReturningUsers.returningUsers

    return {
      title: {
        text: `👥 ${t('newVsReturningUsers')}`,
        left: 'center',
        textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9' },
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: [t('newUsers'), t('returningUsers')],
        top: 40,
        textStyle: { color: '#cbd5e1', fontSize: 12 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: currentLanguage === 'zh' 
          ? ['用户数', '会话数', '事件数']
          : ['User Count', 'Sessions', 'Events'],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      },
      series: [
        {
          name: t('newUsers'),
          type: 'bar',
          data: [
            newUsers.count,
            newUsers.sessions,
            newUsers.events
          ],
          itemStyle: {
            color: '#10b981',
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: '#cbd5e1',
            fontSize: 11
          }
        },
        {
          name: t('returningUsers'),
          type: 'bar',
          data: [
            returningUsers.count,
            returningUsers.sessions,
            returningUsers.events
          ],
          itemStyle: {
            color: '#6366f1',
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: '#cbd5e1',
            fontSize: 11
          }
        }
      ]
    }
  }


  // 桑基图配置（行为流）
  const getSankeyOption = () => {
    if (!stats?.behaviorFlow?.transitions || Object.keys(stats.behaviorFlow.transitions).length === 0) {
      return {
        title: {
          text: '🌊 用户行为流',
          left: 'center',
          textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无行为流数据',
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 16
          }
        }
      }
    }
    
    let nodes, links
    const transitions = stats.behaviorFlow.transitions
    const pageSet = new Set()
    const referrerSet = new Set() // 访问来源集合
    
    Object.keys(transitions).forEach(key => {
      const [from, to] = key.split('→')
      // 判断是否是访问来源（不再包含"内部:"）
      const isReferrer = from === '直接访问' || 
                        from === '微信' || from === '百度' || from === 'Google' || 
                        from === 'Bing' || from === '微博' || from === '知乎' || 
                        from === 'GitHub' || from === 'Twitter' || from === 'Facebook' ||
                        from === 'LinkedIn' || from === 'YouTube' || from === 'Reddit' ||
                        from === '钉钉' ||
                        (!from.startsWith('/') && !from.includes('://') && from.includes('.'))
      if (isReferrer) {
        referrerSet.add(from)
      } else {
        pageSet.add(from)
      }
      pageSet.add(to)
    })
    
    // 过滤出现次数少的页面
    const pageCounts = {}
    Object.entries(transitions).forEach(([key, value]) => {
      const [from, to] = key.split('→')
      // 只统计页面，不统计访问来源（不再包含"内部:"）
      const isReferrer = from === '直接访问' || 
                        from === '微信' || from === '百度' || from === 'Google' || 
                        from === 'Bing' || from === '微博' || from === '知乎' || 
                        from === 'GitHub' || from === 'Twitter' || from === 'Facebook' ||
                        from === 'LinkedIn' || from === 'YouTube' || from === 'Reddit' ||
                        from === '钉钉' ||
                        (!from.startsWith('/') && !from.includes('://') && from.includes('.'))
      if (!isReferrer) {
        pageCounts[from] = (pageCounts[from] || 0) + value
      }
      pageCounts[to] = (pageCounts[to] || 0) + value
    })
    
    const totalCount = Object.values(pageCounts).reduce((a, b) => a + b, 0)
    // 降低过滤阈值，让更多页面显示（从5%降到1%），或者如果数据量小，不过滤
    const minCount = totalCount > 100 ? Math.max(1, totalCount * 0.01) : 1
    const mainPages = new Set(
      Object.entries(pageCounts)
        .filter(([page, count]) => count >= minCount)
        .map(([page]) => page)
    )
    
    // 创建节点（先添加访问来源节点）
    nodes = []
    referrerSet.forEach(referrer => {
      nodes.push({
        name: referrer,
        originalPath: referrer,
        isReferrer: true
      })
    })
    
    // 添加页面节点
    Array.from(mainPages).forEach(page => {
      nodes.push({
        name: getPageLabel(page, t),
        originalPath: page,
        isReferrer: false
      })
    })
    
    const otherPages = Array.from(pageSet).filter(p => {
      if (mainPages.has(p)) return false
      const isReferrer = p === '直接访问' || 
                        p === '微信' || p === '百度' || p === 'Google' || 
                        p === 'Bing' || p === '微博' || p === '知乎' || 
                        p === 'GitHub' || p === 'Twitter' || p === 'Facebook' ||
                        p === 'LinkedIn' || p === 'YouTube' || p === 'Reddit' ||
                        p === '钉钉' ||
                        (!p.startsWith('/') && !p.includes('://') && p.includes('.'))
      return !isReferrer
    })
    if (otherPages.length > 0) {
      nodes.push({ name: t('other'), originalPath: '__other__', isReferrer: false })
    }
    
    // 创建连接
    links = []
    const nodeMap = new Map(nodes.map((n, i) => [n.originalPath, i]))
    
    Object.entries(transitions).forEach(([key, value]) => {
      const [from, to] = key.split('→')
      
      // 处理访问来源节点（不再包含"内部:"）
      let fromNode, toNode
      const isReferrer = from === '直接访问' || 
                        from === '微信' || from === '百度' || from === 'Google' || 
                        from === 'Bing' || from === '微博' || from === '知乎' || 
                        from === 'GitHub' || from === 'Twitter' || from === 'Facebook' ||
                        from === 'LinkedIn' || from === 'YouTube' || from === 'Reddit' ||
                        from === '钉钉' ||
                        (!from.startsWith('/') && !from.includes('://') && from.includes('.'))
      
      if (isReferrer) {
        fromNode = from // 访问来源直接使用
      } else {
        fromNode = mainPages.has(from) ? from : '__other__'
      }
      
      toNode = mainPages.has(to) ? to : '__other__'
      
      const sourceIdx = nodeMap.get(fromNode)
      const targetIdx = nodeMap.get(toNode)
      
      if (sourceIdx !== undefined && targetIdx !== undefined && sourceIdx !== targetIdx) {
        const linkKey = `${sourceIdx}→${targetIdx}`
        const existingLink = links.find(l => `${l.source}→${l.target}` === linkKey)
        if (existingLink) {
          existingLink.value += value
        } else {
          links.push({
            source: sourceIdx,
            target: targetIdx,
            value: value
          })
        }
      }
    })
    
    // 移除循环，确保是DAG
    try {
      links = removeCycles(links, nodes.length)
    } catch (error) {
      console.error('移除循环时出错:', error)
      // 如果出错，至少保留一些边（只保留前10条流量最大的）
      links = links
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .filter(link => {
          const source = parseInt(link.source)
          const target = parseInt(link.target)
          return !isNaN(source) && !isNaN(target) && 
                 source >= 0 && source < nodes.length && 
                 target >= 0 && target < nodes.length &&
                 source !== target
        })
    }
    
    // 如果没有有效连接，返回空状态
    if (!links || links.length === 0) {
      return {
        title: {
          text: '🌊 用户行为流',
          left: 'center',
          textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无行为流数据',
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 16
          }
        }
      }
    }
    
      return {
        title: {
          text: `🌊 ${t('behaviorFlow')}`,
          left: 'center',
          textStyle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600 }
        },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
          formatter: (params) => {
          if (params.dataType === 'node') {
            return `${params.name}<br/>${t('visitCount')}: ${params.value || 0}`
          } else {
            return `${params.data.source} ${t('to')} ${params.data.target}<br/>${t('visitCount')}: ${params.data.value}`
          }
        }
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: nodes.map(n => ({ name: n.name })),
        links: links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#334155'
        },
        label: {
          color: '#cbd5e1',
          fontSize: 12,
          fontWeight: 500
        }
      }]
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* 头部 */}
      <div className="header">
        <div>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <div className="header-actions">
          <div className="language-selector" style={{ marginRight: '1rem' }}>
            <button
              className={currentLanguage === 'en' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => toggleLanguage()}
              style={{
                background: currentLanguage === 'en' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: '1px solid #334155',
                color: currentLanguage === 'en' ? '#06b6d4' : '#cbd5e1',
                padding: '0.4rem 0.8rem',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginRight: '0.5rem'
              }}
            >
              EN
            </button>
            <button
              className={currentLanguage === 'zh' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => toggleLanguage()}
              style={{
                background: currentLanguage === 'zh' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: '1px solid #334155',
                color: currentLanguage === 'zh' ? '#06b6d4' : '#cbd5e1',
                padding: '0.4rem 0.8rem',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              中文
            </button>
          </div>
          <div className="time-range-selector">
            <button 
              className={timeRange === 'date' ? 'btn-time active' : 'btn-time'}
              onClick={() => setTimeRange('date')}
            >
              {t('date')}
            </button>
            <button 
              className={timeRange === 'hour' ? 'btn-time active' : 'btn-time'}
              onClick={() => setTimeRange('hour')}
            >
              {t('hour')}
            </button>
          </div>
          <button className="btn-primary" onClick={fetchStats} disabled={loading}>
            {loading ? t('refreshing') : `🔄 ${t('refresh')}`}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setShowClearDialog(true)}
            style={{ 
              marginLeft: '0.5rem',
              backgroundColor: '#ef4444',
              borderColor: '#ef4444'
            }}
          >
            🗑️ {t('clearData')}
          </button>
        </div>
      </div>

      {/* 清空数据密码对话框 */}
      {showClearDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.25rem' }}>
              ⚠️ {t('clearDataConfirm')}
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {t('clearDataWarning')}
            </p>
            <input
              type="password"
              value={clearPassword}
              onChange={(e) => setClearPassword(e.target.value)}
              placeholder={t('enterPassword')}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '1rem',
                marginBottom: '1rem',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleClearData()
                }
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowClearDialog(false)
                  setClearPassword('')
                  setError(null)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleClearData}
                disabled={clearing || !clearPassword}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: clearing ? '#64748b' : '#ef4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  cursor: clearing ? 'not-allowed' : 'pointer'
                }}
              >
                {clearing ? t('clearing') : t('confirm')}
              </button>
            </div>
            {error && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#7f1d1d',
                border: '1px solid #991b1b',
                borderRadius: '4px',
                color: '#fca5a5',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 错误提示条（非阻塞） */}
      {error && (
        <div className="error-banner">
          <div className="error-banner-content">
            <span>⚠️ {error}</span>
          </div>
          <button 
            className="error-banner-close" 
            onClick={() => setError(null)}
            title={t('close') || 'Close'}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI 指标卡片 */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('totalEvents')}</div>
            <div className="kpi-value">{formatNumber(kpis.totalEvents)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('totalSessions')}</div>
            <div className="kpi-value">{formatNumber(kpis.totalSessions)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('avgSessionDuration')}</div>
            <div className="kpi-value">{formatDuration(kpis.avgSessionDuration)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🛤️</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('avgPathLength')}</div>
            <div className="kpi-value">{kpis.avgPathLength}</div>
            <div className="kpi-sub">{t('pagesPerSession')}</div>
          </div>
        </div>
        {/* 新增指标 */}
        <div className="kpi-card">
          <div className="kpi-icon">🧑‍💻</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('activeUsers')}</div>
            <div className="kpi-value">{formatNumber(kpis.activeUsers)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🚪</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('bounceRate')}</div>
            <div className="kpi-value">{kpis.bounceRate}%</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🚀</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('topSecondStepEvent')}</div>
            <div className="kpi-value" style={{ fontSize: '1rem', lineHeight: '1.4' }}>
              {kpis.topSecondStepEvent ? (
                <>
                  {getEventLabel(kpis.topSecondStepEvent.event, t)}
                  <div className="kpi-sub">{getPageLabel(kpis.topSecondStepEvent.page, t)}</div>
                </>
              ) : (
                t('noData')
              )}
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🧯</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('topDropOffTransition')}</div>
            <div className="kpi-value" style={{ fontSize: '1rem', lineHeight: '1.4' }}>
              {kpis.topDropOffTransition ? (
                <>
                  {getEventLabel(kpis.topDropOffTransition.fromEvent, t)} ({getPageLabel(kpis.topDropOffTransition.fromPage, t)})
                  <div className="kpi-sub">
                    {t('to')} {getEventLabel(kpis.topDropOffTransition.toEvent, t)} ({getPageLabel(kpis.topDropOffTransition.toPage, t)})
                  </div>
                  <div className="kpi-sub" style={{ color: '#ef4444', marginTop: '0.25rem' }}>
                    {t('dropoff')} {kpis.topDropOffTransition.dropoffRate.toFixed(1)}%
                  </div>
                </>
              ) : (
                t('noData')
              )}
            </div>
          </div>
        </div>
        {/* 在线用户指标 */}
        <div className="kpi-card">
          <div className="kpi-icon">🟢</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('onlineUsers')}</div>
            <div className="kpi-value">{formatNumber(kpis.onlineUsers.count)}</div>
            <div className="kpi-sub">{t('onlineSessions')}: {formatNumber(kpis.onlineUsers.sessions)}</div>
            <div className="kpi-sub" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('last5Minutes')}</div>
          </div>
        </div>
      </div>

      {/* 主要图表区域 */}
      <div className="charts-grid">
        {/* 时间序列图 */}
        <div className="chart-card chart-large">
          <ReactECharts
            option={getTimeSeriesOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 事件分布 */}
        <div className="chart-card">
          <ReactECharts
            option={getEventDistributionOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 页面访问量 */}
        <div className="chart-card">
          <ReactECharts
            option={getPageViewsOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 浏览器分布 */}
        <div className="chart-card">
          <ReactECharts
            option={getBrowserDistributionOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 平台分布 */}
        <div className="chart-card">
          <ReactECharts
            option={getPlatformDistributionOption()}
            style={{ height: '450px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 新老用户对比柱状图 */}
        <div className="chart-card">
          <ReactECharts
            option={getNewVsReturningUsersOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 世界地图 - 用户地理位置分布 */}
        <div className="chart-card chart-full">
          <ReactECharts
            option={getWorldMapOption()}
            style={{ height: '500px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* 行为流桑基图 */}
        <div className="chart-card chart-large">
          <ReactECharts
            option={getSankeyOption()}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

      </div>

      {/* 最近事件表格 */}
      {stats?.recentEvents && stats.recentEvents.length > 0 && (
        <div className="table-card">
          <h2 className="table-title">📋 {t('recentEvents')}</h2>
          <div className="table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>{t('time')}</th>
                  <th>{t('eventType')}</th>
                  <th>{t('pageLabel')}</th>
                  <th>{t('userId')}</th>
                  <th>{t('sessionId')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.map((event, idx) => (
                  <tr key={idx}>
                    <td>{new Date(event.timestamp).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US')}</td>
                    <td>
                      <span className={`event-badge event-badge-${event.event}`}>
                        {getEventLabel(event.event, t)}
                      </span>
                    </td>
                    <td>{getPageLabel(event.page || event.path, t)}</td>
                    <td className="text-muted">{event.userId?.substring(0, 20)}...</td>
                    <td className="text-muted">{event.sessionId?.substring(0, 20)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
