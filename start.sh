#!/bin/bash

# 一键启动脚本 - 同时启动前端和后端
# 使用方法: ./start.sh 或 bash start.sh

echo "🚀 正在启动所有服务..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 安装主项目依赖..."
  npm install
fi

if [ ! -d "analytics-react/node_modules" ]; then
  echo "📦 安装分析仪表盘依赖..."
  cd analytics-react && npm install && cd ..
fi

echo ""
echo "✅ 依赖检查完成"
echo ""
echo "🌐 启动服务："
echo "   - 主前端: http://localhost:5771"
echo "   - 后端API: http://localhost:5707"
echo "   - 分析仪表盘: http://localhost:5767"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 使用 concurrently 同时启动三个服务
npx concurrently \
  -n "前端,后端,仪表盘" \
  -c "cyan,magenta,yellow" \
  "npm run dev" \
  "npm run server" \
  "cd analytics-react && npm run dev"

