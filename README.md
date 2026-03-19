# Motila

基于 **Refine + Ant Design + NestJS + Prisma + SQLite（开发环境）** 的后台管理系统。

---

## 1. 技术栈

- **前端**：React 19 + Vite + TypeScript + Ant Design + Refine
- **后端**：NestJS 11 + TypeScript
- **数据层**：Prisma ORM（开发默认 SQLite）
- **进程管理**：PM2（可选，用于长期运行）

---

## 2. 当前已实现功能（截至 2026-03-16）

### 2.1 认证与账号
- 登录 / 注册 / JWT 鉴权
- `/auth/me` 获取当前用户信息
- 修改本人密码
- 忘记密码（邮箱找回）：`POST /auth/forgot-password`，支持用户名或邮箱提交；**不再暴露账号是否存在**
- 新增图形验证码接口：`GET /auth/captcha?scene=login|register|forgotPassword`
- 登录 / 注册 / 忘记密码已接入真实验证码闭环：
  - 风控命中后后端返回 `needCaptcha`
  - 前端自动展示验证码输入区与“换一张”操作
  - 验证码校验通过后再继续提交认证请求

### 2.2 用户管理
- 用户列表、新建、编辑、删除
- 管理员安全策略（禁止误删/误降权）
- 编辑用户：用户名回显修复，用户名唯一性校验
- 编辑布局：主字段4列，头像相关字段2列
- 用户头像：
  - 点击头像区域直接上传/替换
  - 右上角叉号一键清除
  - 编辑页上传预览改为圆形显示风格
  - 展示优先级：`avatarImage` > `avatarUrl`

### 2.3 风控配置中心（新增）
- 新增“配置 -> 风控配置”页面
- 支持维护登录 / 注册 / 忘记密码三类场景策略
- 支持配置：总开关、Redis 降级策略、场景阈值、黑白名单、版本发布与回滚
- 支持风控状态重置：按 IP 或按用户/账号清理运行期计数与封禁（可选场景）
- 后端 auth 接口已接入风控运行层：
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/forgot-password`
- Redis 可用时支持按 IP / 账号进行频率限制与失败封禁
- Redis 不可用且降级策略为 `ALLOW_WITH_CAPTCHA` 时，开发环境会回退到内存计数，避免风控功能完全失效

### 2.4 邮箱配置（个人信息页）
- 支持 QQ / 163 邮箱配置（SMTP/IMAP）
- 可维护：邮箱账号、授权码、进出端口、SSL
- 支持“测试配置”按钮（验证 SMTP 连接与认证并发送测试邮件）
- 授权码后端加密存储，接口返回脱敏显示

### 2.5 系统配置（配置 -> 系统配置）
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
  - 支持手动清空 `logoImage` 文本后保存删除
  - 兼容创建/编辑接口差异：`removeLogoImage` 仅在编辑(PATCH)提交，避免创建(POST)校验报错
- Footer 支持部分超链接 Markdown：`[文本](https://example.com)`
- 后端 body limit：`2mb`（支持 base64 Logo 上传）
- 登录页浏览器标题：优先使用系统配置生效项 `title`，无配置时为 `Welcome to Motila`
- 首屏默认标题：`index.html` 默认值已改为 `Welcome to Motila`（避免先显示 `frontend` 再切换）

- RBAC 分配用户弹窗支持全量用户拉取（`pageSize=0`），避免分页校验报错
- 新增权限点：`settings.read`、`settings.update`
- 模块开关（启用/禁用）影响菜单与路由可见性

### 2.6 界面与导航
### 2.6.1 未登录首页（新增）
- 未登录访问系统时优先展示品牌首页（Landing Page）
- 首页当前采用更干净的极简首屏：移除 `Hello World` 大字、顶部品牌标题、登录按钮与“立即开始”按钮
- Header 左侧恢复系统 Logo，默认读取系统配置中的 `logoImage` / `logoUrl`
- 顶部 `博文 / 文档 / 社区` 导航改为更有层次的胶囊按钮分布；唯一主操作按钮为“进入系统”
- 终端式动态打字机文案 `WELCOME TO MOTILA.` 上移到终端内容区域顶部，且打字节奏放缓
- Footer 固定贴底显示，并通过顶部分割线与毛玻璃底板强化分界
- 登录/注册页已从首页分离：仅在 `/login`、`/register` 路径展示独立认证卡片页面
- 登录/注册页支持相互切换，切换时同步更新浏览器路由，便于直接访问与刷新保留页面

- 博客管理拆分为「博客分类 / 博客文章」独立菜单与页面
- 分类/文章采用列表页 + 详情页 + 创建/编辑页模式，创建/编辑不再使用弹窗
- 未登录入口分为两层：`/` 为极简 Hello World 首页，`/blog` 为公开博客页；首页顶部「博文」按钮跳转到独立博客页
- 公开博客页支持分类筛选、关键词搜索、分页浏览、沉浸式文章详情，并复用系统配置 Footer 文案
- 公开博客页外层横向留白与首页保持一致，避免首页与博客页左右边距不统一
- 修复公开博客页因详情状态参与列表请求依赖导致的反复重渲染 / 闪屏问题
- 博客文章列表支持勾选后批量发布，已发布文章会统一写入发布时间并在公开博客页可见
- 公开博客页移除顶部 featured hero 区块，文章列表直接作为页面主入口，默认改为列表模式展示，默认每页展示 20 篇文章
- 顶部菜单支持点击品牌 Logo 返回首页；移除“首页”按钮，其余按钮保留，且菜单栏吸顶贴边并左右铺满展示
- 基础框架修正：带操作区（Card extra）的业务卡片头部默认显示，避免创建/编辑页保存/取消按钮被全局样式隐藏
- 用户管理列表移动端支持横向滚动，避免小屏内容溢出
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

### 2.7 域名访问与 Vite Host 校验
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
- 后端环境变量建议：
  - `JWT_SECRET`：JWT 签名密钥
  - `EMAIL_CONFIG_SECRET`：邮箱授权码加解密密钥（未设置时回退到 `JWT_SECRET`）
  - `REDIS_URL`：Redis 连接串（推荐）
  - 或使用 `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB`

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

> 若历史 migration 与本地 `dev.db` 存在 drift，当前可先使用 `npx prisma db push` 完成开发验证，后续再统一修复迁移链路。

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
- 前后端生产构建：通过
- `GET /auth/captcha?scene=login`：可返回验证码数据结构
- 风控命中验证码场景后，前端会自动出现验证码输入区与“换一张”按钮

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
- 项目/人员管理：编辑从弹窗改为标准页内编辑卡片；列表支持点击行进入编辑
- 列表支持批量勾选与批量删除（复制/失效暂占位）
- 用户管理：列表支持行点击编辑、多选批量删除；编辑页头像置顶
- 邮件发件中心：`/emails/send`（依赖用户邮箱配置）
- 接口：`POST /emails/send`、`GET /emails/send-logs`
- 收件箱能力：`POST /emails/sync`（IMAP同步）、`GET /emails/inbox`、`GET /emails/:id`

### 2.8 项目管理与人员管理（页面化）
- 列表页仅保留筛选 + 列表，不再在列表下方内嵌创建/编辑卡片
- 新建：
  - 项目：`/projects/create`
  - 人员：`/hr/employees/create`
- 查看：
  - 项目：`/projects/:id`
  - 人员：`/hr/employees/:id`
- 编辑：
  - 项目：`/projects/:id/edit`
  - 人员：`/hr/employees/:id/edit`
- 列表行点击进入详情页，详情页可再进入编辑页

### 2.9 刷新留页与权限拦截优化
- 修复在项目管理/人员管理页面按 F5 后偶发提示“当前无权限或模块已关闭”并误跳仪表盘的问题
- 处理方式：权限与模块状态未加载完成前不执行路由拦截，加载完成后再按真实权限判断

### 2.10 列表批量删除交互统一
- 用户/项目/人员列表批量动作统一为“删除”
- 勾选数据后点击删除，会弹出确认框：
  - 文案：`要删除当前选中的N条记录吗？`
  - 点击“确认”执行删除
  - 点击“取消”不删除

### 2.11 权限配置页面重构
- 列表页：支持多选、创建、删除（系统内置角色禁删）
- 编辑页：`/settings/rbac/:code`，提供“保存/返回”固定操作区
- 创建页：`/settings/rbac/create`
- 权限点选择支持跨模块混搭，切换模块不会清空已选项
