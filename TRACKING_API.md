# 用户行为统计系统 - API接口文档

## 概述

本系统实现了完整的前端埋点和后端统计服务器功能，用于记录和统计网站用户行为数据。

## 系统架构

1. **前端埋点** - 在路由守卫和组件中收集用户行为数据
2. **后端接口（统计服务器）** - Express服务器接收和存储埋点数据
3. **数据存储** - JSON文件存储事件数据（位于 `data/tracking/`）

---

## 后端API接口定义

### 1. POST /api/track

**功能**：接收前端埋点数据

**请求方式**：POST

**请求头**：
```
Content-Type: application/json
```

**请求体**：
```json
{
  "event": "page_view",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user_1234567890_abc",
  "sessionId": "session_1234567890_xyz",
  "url": "http://localhost:5173/about",
  "path": "/about",
  "referrer": "http://localhost:5173/",
  "device": {
    "userAgent": "Mozilla/5.0...",
    "language": "zh-CN",
    "platform": "MacIntel",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "viewportWidth": 1440,
    "viewportHeight": 900
  },
  "page": "/about",
  "pageName": "About",
  "from": "/"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "eventId": "event_1234567890_def"
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "Missing required field: event"
}
```

---

### 2. GET /api/stats

**功能**：获取统计数据

**请求方式**：GET

**查询参数**：
- `event` (可选) - 事件类型筛选，如 `page_view`、`button_click`
- `startDate` (可选) - 开始日期，格式：`YYYY-MM-DD`
- `endDate` (可选) - 结束日期，格式：`YYYY-MM-DD`
- `page` (可选) - 页面路径筛选，如 `/about`

**请求示例**：
```
GET /api/stats?event=page_view&page=/about&startDate=2024-01-01
```

**响应示例**：
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "byEvent": {
      "page_view": 100,
      "button_click": 50
    },
    "byPage": {
      "/": 50,
      "/about": 30,
      "/projects": 20
    },
    "byDate": {
      "2024-01-01": 50,
      "2024-01-02": 100
    },
    "topPages": [
      { "page": "/", "count": 50 },
      { "page": "/about", "count": 30 }
    ],
    "topEvents": [
      { "event": "page_view", "count": 100 },
      { "event": "button_click", "count": 50 }
    ],
    "recentEvents": [...]
  },
  "filters": {
    "event": "page_view",
    "startDate": "2024-01-01",
    "endDate": null,
    "page": "/about"
  }
}
```

---

### 3. GET /api/events

**功能**：获取原始事件列表（用于调试）

**请求方式**：GET

**查询参数**：
- `limit` (可选) - 返回事件数量，默认100
- `event` (可选) - 事件类型筛选
- `page` (可选) - 页面路径筛选

**请求示例**：
```
GET /api/events?limit=50&event=button_click
```

**响应示例**：
```json
{
  "success": true,
  "events": [
    {
      "id": "event_1234567890_abc",
      "event": "button_click",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "userId": "user_123",
      "sessionId": "session_456",
      "page": "/",
      "buttonName": "email",
      ...
    }
  ],
  "total": 150
}
```

---

### 4. GET /api/health

**功能**：健康检查接口

**请求方式**：GET

**响应示例**：
```json
{
  "success": true,
  "message": "Tracking server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 前端埋点使用

### 1. 在组件中使用埋点

```javascript
import { useTracking } from '@/composables/useTracking'

const { trackButtonClick, trackLinkClick } = useTracking()

// 记录按钮点击
const handleButtonClick = () => {
  trackButtonClick('email', { page: '/home' })
}

// 记录链接点击
const handleLinkClick = (url) => {
  trackLinkClick(url, 'GitHub Link')
}
```

### 2. 路由守卫中的自动埋点

页面访问埋点已在路由守卫中自动实现，无需手动添加。

### 3. 自定义事件

```javascript
import { useTracking } from '@/composables/useTracking'

const { trackCustomEvent } = useTracking()

// 记录自定义事件
trackCustomEvent('form_submit', {
  formName: 'contact',
  fieldCount: 5
})
```

---

## 启动服务器

### 安装依赖
```bash
npm install
```

### 启动后端服务器
```bash
# 普通启动
npm run server

# 开发模式（自动重启）
npm run dev:server
```

### 启动前端开发服务器
```bash
npm run dev
```

---

## 配置说明

### 后端端口
默认端口：`3000`
可通过环境变量修改：`PORT=3000 npm run server`

### API地址配置
前端埋点默认连接到：`http://localhost:3000/api`

如需修改，创建 `.env` 文件：
```
VITE_API_BASE_URL=http://your-server.com/api
```

---

## 数据存储

- **存储位置**：`data/tracking/events.json`
- **数据格式**：JSON数组
- **数据保留**：最多保留最近10000条事件记录

**注意**：`data/tracking/` 目录已添加到 `.gitignore`，不会提交到Git仓库。

---

## 事件类型

系统支持以下标准事件类型：

- `page_view` - 页面访问
- `button_click` - 按钮点击
- `link_click` - 链接点击

你也可以发送自定义事件类型，系统会自动记录。

---

## 示例：测试API

使用 curl 测试接口：

```bash
# 发送埋点数据
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "event": "page_view",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/test",
    "page": "/test"
  }'

# 获取统计数据
curl http://localhost:3000/api/stats

# 获取事件列表
curl http://localhost:3000/api/events?limit=10
```

