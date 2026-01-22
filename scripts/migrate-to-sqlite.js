// 数据迁移脚本：将 JSON 文件数据迁移到 SQLite 数据库
// 使用方法: node scripts/migrate-to-sqlite.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { insertEvent, getEventCount, getDatabase } from '../server/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../data/tracking')
const TRACKING_FILE = path.join(DATA_DIR, 'events.json')

console.log('🔄 开始迁移数据到 SQLite...\n')

// 检查 JSON 文件是否存在
if (!fs.existsSync(TRACKING_FILE)) {
  console.log('ℹ️  未找到 events.json 文件，无需迁移')
  process.exit(0)
}

// 读取 JSON 数据
let events = []
try {
  const data = fs.readFileSync(TRACKING_FILE, 'utf8')
  events = JSON.parse(data)
  console.log(`📄 从 JSON 文件读取到 ${events.length} 条事件`)
} catch (error) {
  console.error('❌ 读取 JSON 文件失败:', error)
  process.exit(1)
}

if (events.length === 0) {
  console.log('ℹ️  JSON 文件为空，无需迁移')
  process.exit(0)
}

// 检查数据库中是否已有数据
const existingCount = getEventCount()
if (existingCount > 0) {
  console.log(`⚠️  数据库中已有 ${existingCount} 条事件`)
  console.log('   迁移将追加新数据，不会覆盖现有数据')
}

// 迁移数据
console.log('\n📦 开始迁移数据...')
let successCount = 0
let failCount = 0

for (let i = 0; i < events.length; i++) {
  const event = events[i]
  try {
    const success = insertEvent(event)
    if (success) {
      successCount++
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r   已迁移: ${i + 1}/${events.length}`)
      }
    } else {
      failCount++
      console.error(`\n❌ 迁移事件失败: ${event.id || 'unknown'}`)
    }
  } catch (error) {
    failCount++
    console.error(`\n❌ 迁移事件时出错: ${error.message}`)
  }
}

console.log(`\n\n✅ 迁移完成！`)
console.log(`   ✅ 成功: ${successCount} 条`)
console.log(`   ❌ 失败: ${failCount} 条`)
console.log(`   📊 数据库总记录数: ${getEventCount()} 条`)

// 备份原 JSON 文件
if (successCount > 0) {
  const backupFile = path.join(DATA_DIR, `events.json.backup.${Date.now()}`)
  try {
    fs.copyFileSync(TRACKING_FILE, backupFile)
    console.log(`\n💾 原 JSON 文件已备份到: ${backupFile}`)
    console.log(`\n💡 建议：迁移成功后可以删除原 JSON 文件以节省空间`)
    console.log(`   删除命令: rm ${TRACKING_FILE}`)
  } catch (error) {
    console.error(`\n⚠️  备份文件失败: ${error.message}`)
  }
}

console.log('\n🎉 迁移完成！')

