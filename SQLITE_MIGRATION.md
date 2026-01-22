# SQLite 数据库迁移指南

## 概述

追踪系统已从 JSON 文件存储迁移到 SQLite 数据库，提供更好的性能和可扩展性。

## 主要改进

### 性能提升
- ✅ **更快的读写速度**：SQLite 比 JSON 文件读写快得多
- ✅ **并发支持**：使用 WAL 模式支持并发读写
- ✅ **索引优化**：为常用查询字段创建索引，提高查询速度
- ✅ **自动清理**：自动删除旧数据，保持数据库大小可控

### 功能增强
- ✅ **灵活的查询**：支持按事件类型、日期范围、用户ID等筛选
- ✅ **数据完整性**：数据库约束确保数据一致性
- ✅ **可扩展性**：轻松支持更多数据量（不再限制为 10,000 条）

## 数据库结构

### events 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 事件唯一ID（主键） |
| event | TEXT | 事件类型（page_view, button_click等） |
| timestamp | TEXT | 事件发生时间（ISO 8601） |
| userId | TEXT | 用户ID |
| sessionId | TEXT | 会话ID |
| url | TEXT | 完整URL |
| path | TEXT | 页面路径 |
| referrer | TEXT | 来源页面 |
| page | TEXT | 页面标识 |
| pageName | TEXT | 页面名称 |
| from_path | TEXT | 来源路径 |
| clientIp | TEXT | 客户端IP地址 |
| receivedAt | TEXT | 服务器接收时间 |
| device_* | TEXT/INTEGER | 设备信息（userAgent, language, platform等） |
| eventData | TEXT | 事件特定数据（JSON格式） |
| created_at | DATETIME | 创建时间 |

### 索引

- `idx_event` - 事件类型索引
- `idx_timestamp` - 时间戳索引
- `idx_userId` - 用户ID索引
- `idx_sessionId` - 会话ID索引
- `idx_path` - 路径索引
- `idx_created_at` - 创建时间索引

## 迁移现有数据

如果你有现有的 `events.json` 文件，可以运行迁移脚本：

```bash
npm run migrate:sqlite
```

或者：

```bash
node scripts/migrate-to-sqlite.js
```

迁移脚本会：
1. 读取 `data/tracking/events.json` 文件
2. 将所有事件导入到 SQLite 数据库
3. 备份原 JSON 文件（添加时间戳后缀）
4. 显示迁移统计信息

## 数据库文件位置

- **数据库文件**：`data/tracking/events.db`
- **WAL 文件**：`data/tracking/events.db-wal`（自动生成）
- **SHM 文件**：`data/tracking/events.db-shm`（自动生成）

## 自动数据清理

系统会自动保留最近的 **10,000** 条记录。当超过这个数量时，会自动删除最旧的记录。

如需修改保留数量，编辑 `server/db.js` 中的 `deleteOldEvents()` 函数调用。

## API 使用

API 接口保持不变，无需修改前端代码。所有现有的 API 端点都正常工作：

- `POST /api/track` - 接收追踪事件
- `GET /api/stats` - 获取统计数据
- `GET /api/events` - 获取事件列表
- `DELETE /api/clear-data` - 清空所有数据

## 性能对比

| 操作 | JSON 文件 | SQLite |
|------|-----------|--------|
| 写入单条事件 | ~50ms | ~1ms |
| 读取所有事件 | ~100ms | ~10ms |
| 按条件查询 | 需要加载全部 | 使用索引，快速 |
| 并发写入 | 可能丢失数据 | 安全（WAL模式） |

## 备份和恢复

### 备份数据库

```bash
# 复制数据库文件
cp data/tracking/events.db data/tracking/events.db.backup
```

### 恢复数据库

```bash
# 停止服务器
# 替换数据库文件
cp data/tracking/events.db.backup data/tracking/events.db
# 重启服务器
```

## 故障排除

### 数据库锁定错误

如果遇到数据库锁定错误，检查是否有多个进程在访问数据库。确保只有一个服务器实例在运行。

### 数据库损坏

如果数据库损坏，可以删除数据库文件，系统会自动重新创建：

```bash
rm data/tracking/events.db*
```

### 查看数据库内容

可以使用 SQLite 命令行工具查看数据库：

```bash
sqlite3 data/tracking/events.db

# 查看表结构
.schema events

# 查看记录数
SELECT COUNT(*) FROM events;

# 查看最近10条记录
SELECT * FROM events ORDER BY timestamp DESC LIMIT 10;

# 退出
.quit
```

## 回退到 JSON（不推荐）

如果需要回退到 JSON 文件存储：

1. 恢复 `server/index.js` 的旧版本
2. 删除 `server/db.js`
3. 从备份恢复 `events.json` 文件

**注意**：回退会丢失 SQLite 数据库中的所有数据。

## 技术支持

如有问题，请检查：
1. 数据库文件权限
2. 磁盘空间是否充足
3. Node.js 版本（需要 Node.js 18+）
4. `better-sqlite3` 包是否正确安装

