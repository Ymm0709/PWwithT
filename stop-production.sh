#!/bin/bash

# 停止生产环境服务脚本
# 使用方法: ./stop-production.sh

echo "🛑 正在停止服务..."

# 读取 PID（如果存在）
if [ -f "logs/app.pid" ]; then
  PID=$(cat logs/app.pid)
  echo "找到进程 ID: $PID"
  
  # 检查进程是否还在运行
  if ps -p $PID > /dev/null 2>&1; then
    kill $PID
    echo "✅ 已停止进程 $PID"
  else
    echo "⚠️  进程 $PID 已不存在"
  fi
  
  rm -f logs/app.pid
fi

# 也尝试通过进程名停止
pkill -f "concurrently" 2>/dev/null
pkill -f "serve -s dist" 2>/dev/null
pkill -f "serve -s analytics-react/dist" 2>/dev/null
pkill -f "node server/index.js" 2>/dev/null

echo "✅ 所有服务已停止"

