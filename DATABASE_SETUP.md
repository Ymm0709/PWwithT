# 数据库设置指南

## 快速回答

**数据库会自动创建，无需手动操作！**

当你启动服务器时，数据库会在第一次接收追踪事件时自动创建。

## 服务器部署步骤

### 1. 安装依赖

```bash
npm install
```

这会安装 `better-sqlite3` 和其他依赖。

### 2. 启动服务器（推荐方式）

直接启动服务器，数据库会自动创建：

```bash
npm run server
```

或者使用生产环境脚本：

```bash
./start-production.sh
```

**数据库会在第一次接收事件时自动创建**，包括：
- ✅ 自动创建 `data/tracking/` 目录
- ✅ 自动创建 `events.db` 数据库文件
- ✅ 自动创建所有表和索引

### 3. 手动初始化（可选）

如果你想在启动服务器前提前创建数据库，可以运行：

```bash
npm run init:db
```

**注意**：这通常不需要，因为服务器会自动处理。

## 验证数据库创建

启动服务器后，检查数据库文件是否存在：

```bash
ls -lh data/tracking/events.db
```

如果文件存在，说明数据库已成功创建。

## 常见问题

### Q: 数据库文件在哪里？

A: `data/tracking/events.db`

### Q: 需要手动创建数据库吗？

A: **不需要**。数据库会在服务器启动并第一次接收事件时自动创建。

### Q: 如果数据库文件不存在会怎样？

A: `better-sqlite3` 会自动创建数据库文件和所有表结构。

### Q: 如何确认数据库已创建？

A: 检查文件是否存在：
```bash
ls data/tracking/events.db
```

或者查看服务器日志，应该会看到：
```
✅ 数据库初始化完成
```

### Q: 数据库权限问题？

A: 确保 `data/tracking/` 目录有写入权限：
```bash
chmod 755 data/tracking
```

如果目录不存在，服务器会自动创建。

### Q: 如何迁移现有 JSON 数据？

A: 如果有 `data/tracking/events.json` 文件，运行：
```bash
npm run migrate:sqlite
```

## 服务器部署完整流程

```bash
# 1. 克隆代码
git clone <your-repo-url>
cd PWwithT

# 2. 安装依赖
npm install

# 3. 启动服务器（数据库会自动创建）
npm run server

# 或者使用生产环境脚本
./start-production.sh
```

**就这么简单！** 数据库会在第一次使用时自动创建。

