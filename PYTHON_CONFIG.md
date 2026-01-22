# 配置 npm 使用 Python 3.9

## 问题

新版本的 npm 不再支持 `npm config set python` 命令。

## 解决方案

### 方法 1：使用环境变量（推荐）

```bash
# 设置环境变量
export npm_config_python=/usr/bin/python3.9

# 然后安装
npm install
```

### 方法 2：在安装命令中直接指定

```bash
npm_config_python=/usr/bin/python3.9 npm install
```

### 方法 3：创建 .npmrc 文件（永久配置）

```bash
# 在项目根目录创建 .npmrc 文件
echo "python=/usr/bin/python3.9" > .npmrc

# 然后安装
npm install
```

### 方法 4：使用 node-gyp 配置

```bash
# 配置 node-gyp 使用 Python 3.9
npm config set node_gyp $(npm prefix -g)/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js
export PYTHON=/usr/bin/python3.9
npm install
```

## 推荐步骤

```bash
# 1. 确认 Python 3.9 路径
which python3.9

# 2. 使用环境变量安装
export npm_config_python=/usr/bin/python3.9
npm install
```

