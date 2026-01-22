// SQLite 数据库模块
// 用于管理追踪事件的数据库操作

import Database from 'better-sqlite3'
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

// 初始化数据库连接
let db = null

/**
 * 获取数据库连接（单例模式）
 */
function getDatabase() {
  if (!db) {
    db = new Database(DB_FILE)
    db.pragma('journal_mode = WAL') // 启用 WAL 模式，提高并发性能
    initializeDatabase(db)
  }
  return db
}

/**
 * 初始化数据库表结构
 */
function initializeDatabase(db) {
  // 创建事件表
  db.exec(`
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
      -- 事件特定字段（JSON格式存储）
      eventData TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_event ON events(event);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_userId ON events(userId);
    CREATE INDEX IF NOT EXISTS idx_sessionId ON events(sessionId);
    CREATE INDEX IF NOT EXISTS idx_path ON events(path);
    CREATE INDEX IF NOT EXISTS idx_created_at ON events(created_at);
  `)

  console.log('✅ 数据库初始化完成')
}

/**
 * 插入事件
 */
function insertEvent(event) {
  const db = getDatabase()
  
  // 提取设备信息
  const device = event.device || {}
  
  // 提取事件特定数据（除了标准字段外的其他数据）
  const standardFields = ['event', 'timestamp', 'userId', 'sessionId', 'url', 'path', 
                         'referrer', 'page', 'pageName', 'from', 'device', 'receivedAt', 
                         'id', 'clientIp']
  const eventData = {}
  Object.keys(event).forEach(key => {
    if (!standardFields.includes(key)) {
      eventData[key] = event[key]
    }
  })
  
  const stmt = db.prepare(`
    INSERT INTO events (
      id, event, timestamp, userId, sessionId, url, path, referrer,
      page, pageName, from_path, clientIp, receivedAt,
      device_userAgent, device_language, device_platform,
      device_screenWidth, device_screenHeight, device_viewportWidth, device_viewportHeight,
      eventData
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `)
  
  try {
    stmt.run(
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
    )
    return true
  } catch (error) {
    console.error('Error inserting event:', error)
    return false
  }
}

/**
 * 查询事件
 */
function queryEvents(filters = {}) {
  const db = getDatabase()
  
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
  const rows = stmt.all(...params)
  
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
}

/**
 * 获取所有事件（用于统计计算）
 */
function getAllEvents() {
  return queryEvents()
}

/**
 * 清空所有事件
 */
function clearAllEvents() {
  const db = getDatabase()
  try {
    db.exec('DELETE FROM events')
    return true
  } catch (error) {
    console.error('Error clearing events:', error)
    return false
  }
}

/**
 * 获取事件总数
 */
function getEventCount() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM events')
  const result = stmt.get()
  return result.count
}

/**
 * 删除旧事件（保留最近的 N 条）
 */
function deleteOldEvents(keepCount = 10000) {
  const db = getDatabase()
  try {
    const count = getEventCount()
    if (count > keepCount) {
      const deleteCount = count - keepCount
      db.exec(`
        DELETE FROM events 
        WHERE id IN (
          SELECT id FROM events 
          ORDER BY timestamp ASC 
          LIMIT ${deleteCount}
        )
      `)
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
function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

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

