# 服务器部署指南

## 快速部署步骤

### 1. Clone 仓库并安装依赖

```bash
git clone https://github.com/Ymm0709/PWwithT.git
cd PWwithT

# 安装主项目依赖
npm install

# 安装分析仪表盘依赖
cd analytics-react
npm install
cd ..
```

### 2. 使用生产环境启动脚本（推荐）

```bash
# 给脚本添加执行权限（如果还没有）
chmod +x start-production.sh stop-production.sh

# 启动服务（会自动构建并后台运行）
./start-production.sh
```

脚本会自动：
- ✅ 检查并构建前端（如果未构建）
- ✅ 检查并构建分析仪表盘（如果未构建）
- ✅ 安装 serve（如果未安装）
- ✅ 使用 nohup 后台启动所有服务

### 3. 查看日志

```bash
# 实时查看日志
tail -f logs/app.log

# 或者查看最后 100 行
tail -n 100 logs/app.log
```

### 4. 停止服务

```bash
./stop-production.sh
```

或者手动停止：

```bash
# 查看进程 ID
cat logs/app.pid

# 停止进程
kill $(cat logs/app.pid)

# 或者强制停止所有相关进程
pkill -f concurrently
pkill -f "serve -s"
pkill -f "node server/index.js"
```

## 服务端口

- **主前端**: http://localhost:5771
- **后端 API**: http://localhost:5707
- **分析仪表盘**: http://localhost:5767

## 手动部署步骤（如果需要）

### 1. 构建前端

```bash
# 构建主前端
npm run build

# 构建分析仪表盘
cd analytics-react
npm run build
cd ..
```

### 2. 安装 serve（用于 serve 静态文件）

```bash
npm install -g serve
```

### 3. 手动启动（使用 nohup）

```bash
# 创建日志目录
mkdir -p logs

# 后台启动所有服务
nohup npx concurrently \
  -n "前端,后端,仪表盘" \
  -c "cyan,magenta,yellow" \
  "serve -s dist -l 5771" \
  "npm run server" \
  "serve -s analytics-react/dist -l 5767" \
  > logs/app.log 2>&1 &

# 保存进程 ID
echo $! > logs/app.pid
```

## 防火墙配置

确保服务器开放了以下端口：

```bash
# Ubuntu/Debian
sudo ufw allow 5707/tcp  # 后端 API
sudo ufw allow 5771/tcp  # 主前端
sudo ufw allow 5767/tcp  # 分析仪表盘

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5707/tcp
sudo firewall-cmd --permanent --add-port=5771/tcp
sudo firewall-cmd --permanent --add-port=5767/tcp
sudo firewall-cmd --reload
```

## 环境变量配置（可选）

如果需要修改 API 地址，创建 `.env` 文件：

```bash
# 主前端 .env
VITE_API_BASE_URL=http://your-server-ip:5707/api
```

```bash
# analytics-react/.env
VITE_API_BASE_URL=http://your-server-ip:5707/api
```

**注意**: 修改环境变量后需要重新构建前端。

## 检查服务状态

```bash
# 检查进程是否运行
ps aux | grep -E "concurrently|serve|node server"

# 检查端口是否监听
netstat -tlnp | grep -E "5707|5771|5767"
# 或使用 ss
ss -tlnp | grep -E "5707|5771|5767"

# 测试 API 是否正常
curl http://localhost:5707/api
```

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :5707
lsof -i :5771
lsof -i :5767

# 停止占用端口的进程
kill -9 <PID>
```

### 2. 构建失败

确保 Node.js 版本 >= 16：

```bash
node --version
```

### 3. serve 命令未找到

```bash
npm install -g serve
```

### 4. 权限问题

```bash
chmod +x start-production.sh stop-production.sh
```

## 更新部署

```bash
# 1. 停止服务
./stop-production.sh

# 2. 拉取最新代码
git pull

# 3. 重新安装依赖（如果有新依赖）
npm install
cd analytics-react && npm install && cd ..

# 4. 重新启动
./start-production.sh
```

## 日志管理

日志文件位置：`logs/app.log`

```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志（如果有）
grep -i error logs/app.log

# 清空日志（谨慎操作）
> logs/app.log
```

