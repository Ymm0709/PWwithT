// SQLite 数据库模块（使用 sql.js - 纯 JavaScript 实现，无需编译）
// 用于管理追踪事件的数据库操作

import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库文件路径
const DATA_DIR = path.join(__dirname, '../data/tracking')
const DB_FILE = path.join(DATA_DIR, 'events.db')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 初始化 SQL.js
let SQL = null
let db = null

/**
 * 初始化 SQL.js
 */
async function initSQL() {
  if (!SQL) {
    // 使用 process.cwd() 获取项目根目录，确保路径正确
    const projectRoot = process.cwd()
    const wasmPath = path.join(projectRoot, 'node_modules/sql.js/dist/sql-wasm.wasm')
    
    // 检查文件是否存在
    if (!fs.existsSync(wasmPath)) {
      console.error(`❌ 找不到 WASM 文件: ${wasmPath}`)
      console.error(`   请确保 sql.js 已正确安装: npm install sql.js`)
      throw new Error(`WASM file not found: ${wasmPath}`)
    }
    
    console.log(`✅ 使用 WASM 文件: ${wasmPath}`)
    
    SQL = await initSqlJs({
      locateFile: (file) => {
        // 始终使用项目根目录下的 node_modules
        const filePath = path.join(projectRoot, 'node_modules/sql.js/dist', file)
        return filePath
      }
    })
  }
  return SQL
}

/**
 * 加载数据库
 */
async function loadDatabase() {
  if (!db) {
    const SQL = await initSQL()
    
    // 如果数据库文件存在，加载它
    if (fs.existsSync(DB_FILE)) {
      const buffer = fs.readFileSync(DB_FILE)
      db = new SQL.Database(buffer)
    } else {
      // 创建新数据库
      db = new SQL.Database()
      await initializeDatabase(db)
      saveDatabase()
    }
  }
  return db
}

/**
 * 保存数据库到文件
 */
function saveDatabase() {
  if (db) {
    try {
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(DB_FILE, buffer)
    } catch (error) {
      console.error('Error saving database:', error)
    }
  }
}

/**
 * 初始化数据库表结构
 */
async function initializeDatabase(dbInstance) {
  // 使用传入的数据库实例，避免循环依赖
  const db = dbInstance || await loadDatabase()
  
  // 创建事件表
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      userId TEXT,
      sessionId TEXT,
      url TEXT,
      path TEXT,
      referrer TEXT,
      page TEXT,
      pageName TEXT,
      from_path TEXT,
      clientIp TEXT,
      receivedAt TEXT NOT NULL,
      device_userAgent TEXT,
      device_language TEXT,
      device_platform TEXT,
      device_screenWidth INTEGER,
      device_screenHeight INTEGER,
      device_viewportWidth INTEGER,
      device_viewportHeight INTEGER,
      eventData TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引以提高查询性能
  db.run(`CREATE INDEX IF NOT EXISTS idx_event ON events(event)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_userId ON events(userId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessionId ON events(sessionId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_path ON events(path)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON events(created_at)`)

  console.log('✅ 数据库初始化完成')
}

/**
 * 获取数据库连接（单例模式）
 */
async function getDatabase() {
  return await loadDatabase()
}

/**
 * 插入事件
 */
async function insertEvent(event) {
  try {
    const db = await loadDatabase()
    
    // 提取设备信息
    const device = event.device || {}
    
    // 提取事件特定数据
    const standardFields = ['event', 'timestamp', 'userId', 'sessionId', 'url', 'path', 
                           'referrer', 'page', 'pageName', 'from', 'device', 'receivedAt', 
                           'id', 'clientIp']
    const eventData = {}
    Object.keys(event).forEach(key => {
      if (!standardFields.includes(key)) {
        eventData[key] = event[key]
      }
    })
    
    db.run(`
      INSERT INTO events (
        id, event, timestamp, userId, sessionId, url, path, referrer,
        page, pageName, from_path, clientIp, receivedAt,
        device_userAgent, device_language, device_platform,
        device_screenWidth, device_screenHeight, device_viewportWidth, device_viewportHeight,
        eventData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event.event,
      event.timestamp,
      event.userId || null,
      event.sessionId || null,
      event.url || null,
      event.path || null,
      event.referrer || null,
      event.page || null,
      event.pageName || null,
      event.from || null,
      event.clientIp || null,
      event.receivedAt || new Date().toISOString(),
      device.userAgent || null,
      device.language || null,
      device.platform || null,
      device.screenWidth || null,
      device.screenHeight || null,
      device.viewportWidth || null,
      device.viewportHeight || null,
      Object.keys(eventData).length > 0 ? JSON.stringify(eventData) : null
    ])
    
    // 自动保存数据库
    saveDatabase()
    
    // 自动清理旧数据
    await deleteOldEvents(10000)
    
    return true
  } catch (error) {
    console.error('Error inserting event:', error)
    return false
  }
}

/**
 * 查询事件
 */
async function queryEvents(filters = {}) {
  try {
    const db = await loadDatabase()
    
    let query = 'SELECT * FROM events WHERE 1=1'
    const params = []
    
    // 事件类型筛选
    if (filters.event) {
      query += ' AND event = ?'
      params.push(filters.event)
    }
    
    // 日期范围筛选
    if (filters.startDate) {
      query += ' AND timestamp >= ?'
      params.push(filters.startDate)
    }
    
    if (filters.endDate) {
      query += ' AND timestamp <= ?'
      params.push(filters.endDate)
    }
    
    // 页面路径筛选
    if (filters.path) {
      query += ' AND path = ?'
      params.push(filters.path)
    }
    
    // 用户ID筛选
    if (filters.userId) {
      query += ' AND userId = ?'
      params.push(filters.userId)
    }
    
    // 会话ID筛选
    if (filters.sessionId) {
      query += ' AND sessionId = ?'
      params.push(filters.sessionId)
    }
    
    // 排序和限制
    query += ' ORDER BY timestamp DESC'
    
    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }
    
    const stmt = db.prepare(query)
    stmt.bind(params)
    
    const rows = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      rows.push(row)
    }
    stmt.free()
    
    // 将数据库行转换为事件对象
    return rows.map(row => {
      const event = {
        id: row.id,
        event: row.event,
        timestamp: row.timestamp,
        userId: row.userId,
        sessionId: row.sessionId,
        url: row.url,
        path: row.path,
        referrer: row.referrer,
        page: row.page,
        pageName: row.pageName,
        from: row.from_path,
        clientIp: row.clientIp,
        receivedAt: row.receivedAt,
        device: {
          userAgent: row.device_userAgent,
          language: row.device_language,
          platform: row.device_platform,
          screenWidth: row.device_screenWidth,
          screenHeight: row.device_screenHeight,
          viewportWidth: row.device_viewportWidth,
          viewportHeight: row.device_viewportHeight
        }
      }
      
      // 解析事件特定数据
      if (row.eventData) {
        try {
          const eventData = JSON.parse(row.eventData)
          Object.assign(event, eventData)
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      return event
    })
  } catch (error) {
    console.error('Error querying events:', error)
    return []
  }
}

/**
 * 获取所有事件（用于统计计算）
 */
async function getAllEvents() {
  return await queryEvents()
}

/**
 * 清空所有事件
 */
async function clearAllEvents() {
  try {
    const db = await loadDatabase()
    db.run('DELETE FROM events')
    saveDatabase()
    return true
  } catch (error) {
    console.error('Error clearing events:', error)
    return false
  }
}

/**
 * 获取事件总数
 */
async function getEventCount() {
  try {
    const db = await loadDatabase()
    const stmt = db.prepare('SELECT COUNT(*) as count FROM events')
    stmt.step()
    const result = stmt.getAsObject()
    stmt.free()
    return result.count
  } catch (error) {
    console.error('Error getting event count:', error)
    return 0
  }
}

/**
 * 删除旧事件（保留最近的 N 条）
 */
async function deleteOldEvents(keepCount = 10000) {
  try {
    const count = await getEventCount()
    if (count > keepCount) {
      const deleteCount = count - keepCount
      const db = await loadDatabase()
      db.run(`
        DELETE FROM events 
        WHERE id IN (
          SELECT id FROM events 
          ORDER BY timestamp ASC 
          LIMIT ${deleteCount}
        )
      `)
      saveDatabase()
      console.log(`🗑️  已删除 ${deleteCount} 条旧事件，保留最近 ${keepCount} 条`)
    }
    return true
  } catch (error) {
    console.error('Error deleting old events:', error)
    return false
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

// 初始化数据库（在模块加载时）
initSQL().then(() => {
  loadDatabase().then(() => {
    initializeDatabase().catch(console.error)
  }).catch(console.error)
}).catch(console.error)

export {
  getDatabase,
  insertEvent,
  queryEvents,
  getAllEvents,
  clearAllEvents,
  getEventCount,
  deleteOldEvents,
  closeDatabase
}
