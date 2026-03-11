# Motila

基于 **Refine + Ant Design + NestJS + Prisma + SQLite（开发环境）** 的后台管理系统。

---

## 1. 技术栈

- **前端**：React 19 + Vite + TypeScript + Ant Design + Refine
- **后端**：NestJS 11 + TypeScript
- **数据层**：Prisma ORM（开发默认 SQLite）
- **进程管理**：PM2（可选，用于长期运行）

---

## 2. 当前已实现功能（截至 2026-03-11）

### 2.1 认证与账号
- 登录 / 注册 / JWT 鉴权
- `/auth/me` 获取当前用户信息
- 修改本人密码

### 2.2 用户管理
- 用户列表、新建、编辑、删除
- 管理员安全策略（禁止误删/误降权）
- 用户头像：
  - 字段：`avatarImage`（上传/base64）、`avatarUrl`
  - 支持上传并预览
  - 展示优先级：`avatarImage` > `avatarUrl`

### 2.3 系统配置（配置 -> 系统配置）
- 配置字段：`name`、`title`、`logoUrl`、`logoImage`、`footerText`、`isActive`
- 生效约束：同一时间仅一条 `isActive=true`
- 站点联动：
  - 左侧 Logo
  - 浏览器标题（`document.title`）
  - 页脚 Footer
- Logo 优先级：`logoImage` > `logoUrl` > 默认文案 `Motila`
- 编辑体验优化：
  - 编辑/新建改为页面内标准编辑区（非弹窗）
  - 支持一键删除已上传 Logo 图片（清空 `logoImage`）
- Footer 支持部分超链接 Markdown：`[文本](https://example.com)`

- RBAC 分配用户弹窗支持全量用户拉取（`pageSize=0`），避免分页校验报错
- 新增权限点：`settings.read`、`settings.update`
- 模块开关（启用/禁用）影响菜单与路由可见性

### 2.5 界面与导航
- 主题皮肤：business / tech / dark / auto
- 顶部用户信息改为 **头像 + 昵称 + 角色**（非按钮风格，下拉菜单保留）
- 移动端导航优化：
  - 小屏隐藏左侧 Sider
  - 顶部提供菜单按钮（☰）
  - 点击后以 Drawer 抽屉形式展示完整菜单
  - 点击菜单项自动关闭抽屉
- 菜单配置支持：
  - `parentKey`（父子绑定）
  - `sortOrder`（排序）
  - 配置驱动构建树，无需改菜单渲染逻辑

### 2.6 域名访问与 Vite Host 校验
- 已在前端 `vite.config.ts` 配置：
  - `server.allowedHosts: ['yangtiancheng.cn', 'www.yangtiancheng.cn']`
- 本地开发已增加 Vite 代理：
  - 前端统一请求 `/api/*`
  - Vite 自动转发到 `http://127.0.0.1:3000/*`
- 解决通过域名访问前端时出现：
  - `Blocked request. This host ("yangtiancheng.cn") is not allowed.`
- 避免本地登录请求命中 `/auth/login` 导致 404（统一改为 `/api/auth/login` 链路）

---

## 3. 目录结构

```text
Motila/
├─ frontend/                 # 前端工程（Vite + React）
├─ backend/                  # 后端工程（NestJS + Prisma）
├─ docs/                     # 文档（产品说明书 / 系统操作手册）
├─ scripts/                  # 脚本目录
├─ ecosystem.config.cjs      # PM2 配置
├─ package.json              # 根目录脚本（dev:all）
└─ README.md
```

---

## 4. 环境要求

- Node.js 20+（建议 22 LTS）
- npm 10+
- PM2（可选）

安装 PM2（可选）：

```bash
npm i -g pm2
```

---

## 5. 本地开发启动

### 5.1 安装依赖

```bash
cd Motila
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 5.2 初始化数据库（首次）

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init_sqlite
cd ..
```

### 5.3 启动

**方式 A（推荐）**

```bash
npm run dev:all
```

**方式 B（分开）**

```bash
# 终端1
npm --prefix backend run start

# 终端2
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
```

默认访问：
- 前端：`http://<host>:5173`
- 后端健康检查：`http://<host>:3000/health`

---

## 6. 生产/长期运行（PM2）

> 当前 `ecosystem.config.cjs` 使用的是开发启动命令（`start` / `vite dev`），适合长期开发机托管；
> 若做正式生产部署，建议补充 `build + start:prod + static server` 方案。

启动：

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 save
```

重启：

```bash
pm2 restart motila-backend motila-frontend
pm2 save
```

---

## 7. 功能验证基线（本次实测）

- `GET /health`：返回 `{"ok":true}`
- 前端首页：HTTP `200`
- 未登录访问 `GET /users`：HTTP `401 Unauthorized`（鉴权生效）

---

## 8. 常见问题

1) **后端 `GET /` 返回 404 是不是挂了？**  
不是。后端健康检查以 `GET /health` 为准。

2) **系统配置改完没生效？**  
确认目标配置 `isActive=true`，并刷新页面。

3) **Logo 没展示？**  
优先检查 `logoImage` 是否存在；其次 `logoUrl` 是否可访问。

4) **头像不显示？**  
确认 `avatarUrl` 是可公网访问的合法 URL。

5) **域名访问前端提示 host 不允许？**  
检查 `frontend/vite.config.ts` 的 `server.allowedHosts` 是否包含当前域名；修改后重启前端/PM2 进程。

---

## 9. 文档入口

- 产品说明书：`docs/产品说明书.md`
- 系统操作手册：`docs/系统操作手册.md`
- 变更记录：`RELEASE.md`
