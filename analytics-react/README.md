# Analytics Dashboard - React + ECharts

使用 React + ECharts 构建的数据分析看板，用于可视化展示统计服务器收集的数据。

## 功能

- 📊 **实时数据展示** - 从统计服务器获取最新数据
- 📈 **时间序列图** - 展示事件数量随时间的变化趋势
- 🎯 **事件分布图** - 饼图展示不同事件类型的占比
- 📄 **页面访问量** - 柱状图展示各页面访问次数
- 🌊 **用户行为流** - 桑基图展示页面到页面的用户行为流向

## 技术栈

- React 18
- ECharts 5
- echarts-for-react
- Vite

## 快速开始

### 1. 安装依赖

```bash
cd analytics-react
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

Dashboard 会在 `http://localhost:5175` 启动

### 3. 确保后端服务器运行

确保统计服务器在 `http://localhost:3000` 运行：

```bash
# 在项目根目录
npm run server
```

## 配置

### API 地址配置

默认连接到 `http://localhost:3000/api`

如需修改，创建 `.env` 文件：

```
VITE_API_BASE_URL=http://your-server.com/api
```

## 项目结构

```
analytics-react/
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 构建生产版本

```bash
npm run build
```

构建文件会在 `dist/` 目录中。

## 与个人网站的关系

- **独立项目** - 完全分离，不依赖个人网站代码
- **共享后端** - 调用同一个统计服务器 API (`http://localhost:3000/api`)
- **独立运行** - 可以单独启动和部署

