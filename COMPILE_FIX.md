# 编译问题解决方案

## 问题

服务器环境太旧，无法编译最新版本的 `better-sqlite3`：
- g++ 不支持 C++20（只支持到 C++2a）
- GLIBC 版本太旧

## 解决方案

### 方案 1：使用旧版本的 better-sqlite3（已更新 package.json）

已降级到 `better-sqlite3@9.2.2`，这个版本支持旧编译器。

在服务器上执行：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 方案 2：如果方案 1 仍然失败，使用 sql.js（纯 JavaScript）

如果编译仍然失败，可以使用 `sql.js`，这是纯 JavaScript 实现，不需要编译。

```bash
# 卸载 better-sqlite3
npm uninstall better-sqlite3

# 安装 sql.js
npm install sql.js
```

但需要修改代码以适配 sql.js 的 API。

## 推荐步骤

1. 先尝试方案 1（已降级版本）
2. 如果失败，再考虑方案 2

