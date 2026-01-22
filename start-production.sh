#!/bin/bash

# 生产环境启动脚本 - 使用 nohup 后台运行
# 使用方法: ./start-production.sh

echo "🚀 正在启动生产环境服务..."
echo ""

# 检查是否已构建主前端
if [ ! -d "dist" ]; then
  echo "📦 主前端未构建，正在构建..."
  npm run build
  if [ ! -d "dist" ]; then
    echo "❌ 错误: 主前端构建失败"
    exit 1
  fi
  echo "✅ 主前端构建完成"
fi

# 检查是否已构建分析仪表盘
if [ ! -d "analytics-react/dist" ]; then
  echo "📦 分析仪表盘未构建，正在构建..."
  cd analytics-react
  npm run build
  cd ..
  if [ ! -d "analytics-react/dist" ]; then
    echo "❌ 错误: 分析仪表盘构建失败"
    exit 1
  fi
  echo "✅ 分析仪表盘构建完成"
fi

# 检查是否安装了 serve（用于 serve 静态文件）
if ! command -v serve &> /dev/null; then
  echo "📦 安装 serve..."
  npm install -g serve
fi

# 创建日志目录
mkdir -p logs

echo ""
echo "✅ 检查完成"
echo ""
echo "🌐 启动服务："
echo "   - 主前端: http://localhost:5771"
echo "   - 后端API: http://localhost:5707"
echo "   - 分析仪表盘: http://localhost:5767"
echo ""
echo "程序将在后台运行，日志输出到 logs/app.log"
echo "查看日志: tail -f logs/app.log"
echo "停止服务: pkill -f concurrently 或 ./stop-production.sh"
echo ""

# 使用 nohup 在后台运行
# serve 命令使用 -l 0.0.0.0:PORT 监听所有网络接口
nohup npx concurrently \
  -n "前端,后端,仪表盘" \
  -c "cyan,magenta,yellow" \
  "serve -s dist -l 0.0.0.0:5771" \
  "npm run server" \
  "serve -s analytics-react/dist -l 0.0.0.0:5767" \
  > logs/app.log 2>&1 &

PID=$!
echo $PID > logs/app.pid
echo "✅ 服务已在后台启动！"
echo "进程 ID: $PID"
echo "PID 已保存到 logs/app.pid"
echo ""
echo "查看日志: tail -f logs/app.log"
echo "停止服务: ./stop-production.sh 或 kill $PID"

