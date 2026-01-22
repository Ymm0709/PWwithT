// 数据库初始化脚本
// 用于在服务器启动前创建数据库和表结构
// 使用方法: node scripts/init-database.js

import { getDatabase, getEventCount, closeDatabase } from '../server/db.js'

console.log('🔧 正在初始化数据库...\n')

async function init() {
  try {
    // 获取数据库连接（会自动创建数据库文件和表结构）
    const db = await getDatabase()
    
    // 检查数据库是否创建成功
    const count = await getEventCount()
    
    console.log('✅ 数据库初始化成功！')
    console.log(`📊 当前事件数量: ${count}`)
    console.log(`💾 数据库文件位置: data/tracking/events.db`)
    console.log('\n🎉 数据库已准备就绪，可以启动服务器了！')
    
    // 关闭数据库连接
    await closeDatabase()
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

init()

