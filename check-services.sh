#!/bin/bash

# 服务状态检查脚本
# 使用方法: ./check-services.sh

echo "🔍 检查服务状态..."
echo ""

# 检查进程
echo "📊 进程检查："
echo "---"
ps aux | grep -E "(serve|node.*server|concurrently)" | grep -v grep || echo "未找到相关进程"
echo ""

# 检查端口监听
echo "🌐 端口监听检查："
echo "---"
echo "端口 5771 (主前端):"
netstat -tlnp 2>/dev/null | grep :5771 || ss -tlnp 2>/dev/null | grep :5771 || echo "  未监听"
echo ""
echo "端口 5707 (后端API):"
netstat -tlnp 2>/dev/null | grep :5707 || ss -tlnp 2>/dev/null | grep :5707 || echo "  未监听"
echo ""
echo "端口 5767 (分析仪表盘):"
netstat -tlnp 2>/dev/null | grep :5767 || ss -tlnp 2>/dev/null | grep :5767 || echo "  未监听"
echo ""

# 检查日志文件
if [ -f "logs/app.log" ]; then
  echo "📝 最近的日志 (最后 20 行):"
  echo "---"
  tail -20 logs/app.log
  echo ""
else
  echo "⚠️  日志文件不存在: logs/app.log"
  echo ""
fi

# 测试后端 API
echo "🧪 测试后端 API:"
echo "---"
if command -v curl &> /dev/null; then
  echo "测试 http://localhost:5707/api/health"
  curl -s http://localhost:5707/api/health || echo "  ❌ 连接失败"
  echo ""
  echo "测试 http://127.0.0.1:5707/api/health"
  curl -s http://127.0.0.1:5707/api/health || echo "  ❌ 连接失败"
else
  echo "  curl 命令不可用，跳过 API 测试"
fi
echo ""

echo "✅ 检查完成"

