// scripts/simulate-requests.js
// 模拟用户行为请求，用于测试埋点系统

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api'

// 生成随机用户ID
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 生成随机会话ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 生成不同国家的模拟IP地址
function generateCountryIp() {
  // 不同国家的IP地址段（用于测试地理位置功能）
  const countryIps = {
    'CN': [ // 中国IP段
      () => `202.${Math.floor(Math.random() * 100) + 96}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `218.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `219.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `220.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `114.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'US': [ // 美国IP段
      () => `3.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `13.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `54.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `52.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `204.${Math.floor(Math.random() * 50) + 150}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'JP': [ // 日本IP段
      () => `126.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `133.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `202.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `210.${Math.floor(Math.random() * 50) + 131}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'GB': [ // 英国IP段
      () => `2.${Math.floor(Math.random() * 15) + 16}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `5.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `51.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `81.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'DE': [ // 德国IP段
      () => `5.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `37.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `46.${Math.floor(Math.random() * 32)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `78.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'KR': [ // 韩国IP段
      () => `133.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'AU': [ // 澳大利亚IP段
      () => `1.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `14.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `27.${Math.floor(Math.random() * 160) + 96}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ],
    'CA': [ // 加拿大IP段
      () => `142.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `162.${Math.floor(Math.random() * 2) + 158}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `198.${Math.floor(Math.random() * 4) + 51}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ]
  }

  // 随机选择一个国家
  const countries = Object.keys(countryIps)
  const country = countries[Math.floor(Math.random() * countries.length)]
  const ipGenerators = countryIps[country]
  const generator = ipGenerators[Math.floor(Math.random() * ipGenerators.length)]
  
  return {
    ip: generator(),
    country: country
  }
}

// 生成设备信息
function generateDeviceInfo() {
  const devices = [
    { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', platform: 'MacIntel' },
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', platform: 'Win32' },
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' },
    { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', platform: 'iPad' }
  ]
  const device = devices[Math.floor(Math.random() * devices.length)]
  return {
    ...device,
    language: Math.random() > 0.5 ? 'zh-CN' : 'en-US',
    screenWidth: Math.floor(Math.random() * 1000) + 1000,
    screenHeight: Math.floor(Math.random() * 500) + 700,
    viewportWidth: Math.floor(Math.random() * 800) + 800,
    viewportHeight: Math.floor(Math.random() * 600) + 600
  }
}

// 发送埋点请求
async function sendTrackingEvent(eventType, eventData = {}, clientIp = null, userId = null, sessionId = null) {
  // 如果没有提供userId和sessionId，则生成新的（用于单个事件）
  const finalUserId = userId || generateUserId()
  const finalSessionId = sessionId || generateSessionId()
  
  const trackingData = {
    event: eventType,
    timestamp: new Date().toISOString(),
    userId: finalUserId,
    sessionId: finalSessionId,
    url: `http://localhost:5173${eventData.path || '/'}`,
    path: eventData.path || '/',
    referrer: eventData.referrer !== undefined ? eventData.referrer : '',
    device: generateDeviceInfo(),
    ...eventData
  }

  // 准备请求头，包含模拟的IP地址（用于测试地理位置功能）
  const headers = {
    'Content-Type': 'application/json'
  }
  
  // 如果提供了客户端IP，添加到请求头中（后端会从这个头获取IP）
  if (clientIp) {
    headers['x-forwarded-for'] = clientIp
    headers['x-real-ip'] = clientIp
  }

  try {
    const response = await fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(trackingData)
    })

    const result = await response.json()
    const status = result.success ? '✅' : '❌'
    const pageInfo = eventData.page || eventData.path || ''
    console.log(`${status} [${eventType}] ${pageInfo} - ${result.success ? 'Success' : result.error || 'Failed'}`)
    return result
  } catch (error) {
    console.error(`❌ [${eventType}] Error:`, error.message)
    return null
  }
}

// 生成随机访问来源
function generateReferrer() {
  const referrers = [
    '', // 直接访问
    'http://localhost:5173/', // 内部链接（会被归类为直接访问）
    'http://localhost:5173/about', // 内部链接（会被归类为直接访问）
    'http://localhost:5173/projects', // 内部链接（会被归类为直接访问）
    'https://mp.weixin.qq.com/s/xxx', // 微信
    'https://www.baidu.com/s?wd=xxx', // 百度
    'https://www.google.com/search?q=xxx', // Google
    'https://www.bing.com/search?q=xxx', // Bing
    'https://weibo.com/xxx', // 微博
    'https://www.zhihu.com/question/xxx', // 知乎
    'https://github.com/xxx', // GitHub
    'https://im.dingtalk.com/xxx', // 钉钉
    'https://oa.dingtalk.com/xxx', // 钉钉
    'https://www.example.com', // 外部网站
  ]
  return referrers[Math.floor(Math.random() * referrers.length)]
}

// 模拟页面访问
async function simulatePageView(page, pageName, from = '', clientIp = null, userId = null, sessionId = null, referrer = null) {
  return sendTrackingEvent('page_view', {
    page: page,
    pageName: pageName,
    from: from,
    path: page,
    referrer: referrer || generateReferrer()
  }, clientIp, userId, sessionId)
}

// 模拟按钮点击
async function simulateButtonClick(buttonName, page = '/', clientIp = null, userId = null, sessionId = null) {
  return sendTrackingEvent('button_click', {
    buttonName: buttonName,
    page: page,
    path: page
  }, clientIp, userId, sessionId)
}

// 模拟链接点击
async function simulateLinkClick(linkUrl, linkText, page = '/', clientIp = null, userId = null, sessionId = null) {
  return sendTrackingEvent('link_click', {
    linkUrl: linkUrl,
    linkText: linkText,
    page: page,
    path: page
  }, clientIp, userId, sessionId)
}

// 模拟滚动深度
async function simulateScrollDepth(scrollPercent, page = '/', clientIp = null, userId = null, sessionId = null) {
  return sendTrackingEvent('scroll_depth', {
    scrollPercent: scrollPercent,
    milestone: scrollPercent >= 100 ? '100%' : scrollPercent >= 75 ? '75%' : scrollPercent >= 50 ? '50%' : '25%',
    page: page,
    path: page
  }, clientIp, userId, sessionId)
}

// 模拟页面停留时长
async function simulateTimeOnPage(duration, page = '/', clientIp = null, userId = null, sessionId = null) {
  return sendTrackingEvent('time_on_page', {
    duration: duration,
    durationFormatted: duration < 60 ? `${duration}秒` : `${Math.floor(duration / 60)}分${duration % 60}秒`,
    page: page,
    path: page
  }, clientIp, userId, sessionId)
}

// 模拟转化事件
async function simulateConversion(goalName, goalData = {}, page = '/', clientIp = null, userId = null, sessionId = null) {
  return sendTrackingEvent('conversion', {
    goalName: goalName,
    goalValue: 1,
    page: page,
    path: page,
    ...goalData
  }, clientIp, userId, sessionId)
}

// 等待函数
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 模拟一个完整的用户会话
async function simulateUserSession(sessionNumber, isNewUser = true, existingUserId = null) {
  // 为每个会话生成一个模拟IP地址（用于测试地理位置功能）
  const { ip: clientIp, country } = generateCountryIp()
  
  // 为这个会话生成固定的userId和sessionId
  // 如果是新用户，生成新的userId；如果是老用户，使用已有的userId
  const userId = existingUserId || generateUserId()
  const sessionId = generateSessionId()
  
  // 为会话生成一个固定的访问来源（第一个页面使用，后续页面使用内部链接）
  const sessionReferrer = generateReferrer()
  
  const userType = isNewUser ? '🆕 新用户' : '🔄 老用户'
  const referrerLabel = sessionReferrer ? (sessionReferrer.includes('weixin') ? '微信' : 
                                           sessionReferrer.includes('baidu') ? '百度' :
                                           sessionReferrer.includes('google') ? 'Google' :
                                           sessionReferrer.includes('localhost') ? '内部链接' : '外部来源') : '直接访问'
  console.log(`\n📊 模拟用户会话 #${sessionNumber} [${country}] IP: ${clientIp}`)
  console.log(`   ${userType} | UserId: ${userId.substring(0, 30)}...`)
  console.log(`   SessionId: ${sessionId.substring(0, 30)}...`)
  console.log(`   访问来源: ${referrerLabel}`)
  console.log('='.repeat(50))

  const pages = ['/', '/about', '/skills', '/projects', '/blog', '/links']
  const randomPage = pages[Math.floor(Math.random() * pages.length)]
  
  try {
    // 1. 访问首页（使用会话的referrer）
    await wait(500)
    await simulatePageView('/', 'Home', '', clientIp, userId, sessionId, sessionReferrer)
    
    // 2. 点击Email按钮
    await wait(300)
    await simulateButtonClick('email_button', '/', clientIp, userId, sessionId)
    
    // 3. 模拟转化：打开邮箱模态框
    await wait(200)
    await simulateConversion('email_modal_opened', {}, '/', clientIp, userId, sessionId)
    
    // 4. 复制邮箱
    await wait(1000)
    await simulateButtonClick('copy_email', '/', clientIp, userId, sessionId)
    await simulateConversion('email_copied', { email: 'yung230630047@126.com' }, '/', clientIp, userId, sessionId)
    
    // 5. 滚动页面
    await wait(800)
    await simulateScrollDepth(25, '/', clientIp, userId, sessionId)
    await wait(500)
    await simulateScrollDepth(50, '/', clientIp, userId, sessionId)
    await wait(500)
    await simulateScrollDepth(75, '/', clientIp, userId, sessionId)
    await wait(500)
    await simulateScrollDepth(100, '/', clientIp, userId, sessionId)
    
    // 6. 点击GitHub链接
    await wait(1000)
    await simulateLinkClick('https://github.com/Ymm0709', 'GitHub Profile', '/', clientIp, userId, sessionId)
    await simulateConversion('github_link_clicked', { linkUrl: 'https://github.com/Ymm0709' }, '/', clientIp, userId, sessionId)
    
    // 7. 点击导航卡片
    const targetPage = pages[Math.floor(Math.random() * (pages.length - 1)) + 1]
    await wait(1000)
    await simulateLinkClick(targetPage, `Navigate to ${targetPage}`, '/', clientIp, userId, sessionId)
    await simulateConversion('nav_card_clicked', { targetPage }, '/', clientIp, userId, sessionId)
    
    // 8. 访问目标页面（使用内部链接作为referrer）
    await wait(500)
    const pageName = targetPage.substring(1).charAt(0).toUpperCase() + targetPage.substring(2)
    await simulatePageView(targetPage, pageName, '/', clientIp, userId, sessionId, 'http://localhost:5173/')
    
    // 9. 模拟停留时长
    const stayDuration = Math.floor(Math.random() * 30) + 10 // 10-40秒
    await wait(stayDuration * 100)
    await simulateTimeOnPage(stayDuration, targetPage, clientIp, userId, sessionId)
    
    // 10. 根据页面类型执行不同操作
    if (targetPage === '/projects') {
      // 项目页面：点击项目卡片
      await wait(1000)
      const projectId = Math.floor(Math.random() * 5) + 1
      await simulateButtonClick('project_card', '/projects', clientIp, userId, sessionId)
      await simulateConversion('project_card_clicked', { 
        projectId: projectId, 
        projectName: `Project ${projectId}` 
      }, '/projects', clientIp, userId, sessionId)
      
      // 访问项目详情（使用内部链接）
      await wait(500)
      await simulatePageView(`/projects/${projectId}`, 'ProjectDetail', '/projects', clientIp, userId, sessionId, 'http://localhost:5173/projects')
      await simulateConversion('project_detail_viewed', { 
        projectId: projectId, 
        projectName: `Project ${projectId}` 
      }, `/projects/${projectId}`, clientIp, userId, sessionId)
      
      // 点击GitHub链接
      await wait(1000)
      await simulateLinkClick(`https://github.com/project${projectId}`, `GitHub - Project ${projectId}`, `/projects/${projectId}`, clientIp, userId, sessionId)
      await simulateConversion('project_detail_github_clicked', { 
        projectId: projectId,
        projectName: `Project ${projectId}` 
      }, `/projects/${projectId}`, clientIp, userId, sessionId)
      
    } else if (targetPage === '/links') {
      // 链接页面：点击外部链接
      await wait(1000)
      const links = [
        { url: 'https://github.com', title: 'GitHub' },
        { url: 'https://vuejs.org', title: 'Vue.js' },
        { url: 'https://developer.mozilla.org', title: 'MDN' }
      ]
      const randomLink = links[Math.floor(Math.random() * links.length)]
      await simulateLinkClick(randomLink.url, randomLink.title, '/links', clientIp, userId, sessionId)
      await simulateConversion('external_link_clicked', { 
        linkUrl: randomLink.url, 
        linkTitle: randomLink.title 
      }, '/links', clientIp, userId, sessionId)
      
    } else if (targetPage === '/blog') {
      // 博客页面：点击博客文章
      await wait(1000)
      const postId = Math.floor(Math.random() * 5) + 1
      await simulateButtonClick('blog_post_card', '/blog', clientIp, userId, sessionId)
      await simulateConversion('blog_post_clicked', { 
        postId: postId 
      }, '/blog', clientIp, userId, sessionId)
      
      // 访问博客详情（使用内部链接）
      await wait(500)
      await simulatePageView(`/blog/${postId}`, 'BlogDetail', '/blog', clientIp, userId, sessionId, 'http://localhost:5173/blog')
    }
    
    // 11. 再次滚动
    await wait(1000)
    await simulateScrollDepth(50, targetPage, clientIp, userId, sessionId)
    await wait(500)
    await simulateScrollDepth(100, targetPage, clientIp, userId, sessionId)
    
    console.log(`✅ 会话 #${sessionNumber} 完成`)
    
    return { userId, sessionId }
    
  } catch (error) {
    console.error(`❌ 会话 #${sessionNumber} 出错:`, error.message)
    return { userId, sessionId }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始模拟用户行为请求...')
  console.log(`📡 API地址: ${API_BASE_URL}`)
  console.log('')

  // 检查服务器是否运行
  try {
    // 构建健康检查URL：从 /api/track 改为 /api/health
    const healthUrl = API_BASE_URL.endsWith('/track') 
      ? API_BASE_URL.replace('/track', '/health')
      : `${API_BASE_URL.replace(/\/$/, '')}/health`
    console.log(`🔍 正在检查服务器: ${healthUrl}`)
    
    const healthCheck = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!healthCheck.ok) {
      console.error('❌ 后端服务器响应异常！')
      console.error(`   状态码: ${healthCheck.status} ${healthCheck.statusText}`)
      const errorText = await healthCheck.text()
      console.error(`   响应内容: ${errorText}`)
      process.exit(1)
    }
    
    const result = await healthCheck.json()
    console.log('✅ 后端服务器连接成功')
    console.log(`   ${result.message || 'Server is running'}\n`)
  } catch (error) {
    console.error('❌ 无法连接到后端服务器！')
    console.error(`   错误类型: ${error.name}`)
    console.error(`   错误信息: ${error.message}`)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   原因: 连接被拒绝，服务器可能未启动')
    } else if (error.code === 'ENOTFOUND') {
      console.error('   原因: 无法解析主机名 localhost')
    } else if (error.cause) {
      console.error(`   底层错误: ${error.cause.message || error.cause}`)
    }
    
    console.log('\n💡 请确保：')
    console.log('   1. 后端服务器正在运行: npm run server')
    console.log('   2. 服务器运行在 http://localhost:3000')
    console.log('   3. 可以手动测试: curl http://localhost:3000/api/health')
    process.exit(1)
  }

  const numSessions = parseInt(process.argv[2]) || 5 // 默认模拟5个会话

  console.log(`📊 将模拟 ${numSessions} 个用户会话`)
  console.log(`   其中包含新用户和老用户（基于session判断）\n`)

  // 存储已创建的用户ID，用于模拟老用户
  const existingUserIds = []
  
  // 模拟多个用户会话
  for (let i = 1; i <= numSessions; i++) {
    // 前60%的会话是新用户，后40%的会话是老用户（使用已有的userId但新的sessionId）
    const isNewUser = i <= Math.ceil(numSessions * 0.6)
    const existingUserId = existingUserIds.length > 0 
      ? existingUserIds[Math.floor(Math.random() * existingUserIds.length)]
      : null
    
    const result = await simulateUserSession(i, isNewUser, existingUserId)
    
    // 如果是新用户，保存userId以便后续模拟老用户
    if (isNewUser && result.userId) {
      existingUserIds.push(result.userId)
    }
    
    // 会话之间等待一段时间
    if (i < numSessions) {
      await wait(2000)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ 所有模拟请求完成！')
  console.log(`\n📊 查看统计数据: ${API_BASE_URL.replace('/track', '/stats')}`)
  console.log(`📋 查看事件列表: ${API_BASE_URL.replace('/track', '/events?limit=50')}`)
  console.log(`\n💡 提示: 可以使用 curl 或浏览器访问上述URL查看结果`)
}

// 运行脚本
main().catch(error => {
  console.error('❌ 脚本执行出错:', error)
  process.exit(1)
})

