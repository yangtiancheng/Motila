# Motila

基于 **Refine + Ant Design + NestJS + Prisma + SQLite（开发环境）** 的综合关系系统工程。

## 技术栈

- **前端**：React 19 + Vite + TypeScript + Refine + Ant Design
- **后端**：NestJS 11 + TypeScript
- **数据层**：Prisma ORM（SQLite 开发库，可平滑切到 PostgreSQL）

## 当前工程结构

```text
Motila/
├─ frontend/                 # Refine + Ant Design 前端管理界面
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  └─ vite.config.ts
│
├─ backend/                  # NestJS 后端服务
│  ├─ src/
│  ├─ test/
│  ├─ prisma/                # Prisma 数据模型
│  │  └─ schema.prisma
│  ├─ prisma.config.ts
│  ├─ .env                   # 数据库连接（本地开发）
│  └─ package.json
│
├─ docs/                     # 架构与业务文档
│  └─ system-spec.md         # 系统说明书
├─ scripts/                  # 自动化脚本
├─ .gitignore
└─ README.md
```

## 一、从 GitHub 下载项目

```bash
git clone git@github.com:yangtiancheng/Motila.git
cd Motila
```

> 若你本机未配置 SSH，可用 HTTPS：
>
> ```bash
> git clone https://github.com/yangtiancheng/Motila.git
> ```

## 二、环境要求

- Node.js 20+（建议 22 LTS）
- npm 10+
- PM2（用于生产/长期运行）

安装 PM2：

```bash
npm i -g pm2
```

## 三、开发环境安装与启动

### 1）安装依赖

```bash
# 在 Motila 根目录
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2）初始化数据库（首次）

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init_sqlite
cd ..
```

### 3）启动项目

方式 A（推荐，一键）：

```bash
npm run dev:all
```

方式 B（分开启动）：

```bash
# 终端1
cd backend
npm run start

# 终端2
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

## 四、生产部署（PM2）

### 1）构建

```bash
cd backend && npm run build
cd ../frontend && npm run build
cd ..
```

### 2）使用 PM2 启动

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 save
```

### 3）更新后发布流程

```bash
git pull
cd backend && npm run build
cd ../frontend && npm run build
cd ..
pm2 restart motila-backend motila-frontend
pm2 save
```

## 五、常见问题

### 1）登录后白屏
- 确认前端已最新代码（`frontend/src/main.tsx` 已使用 `BrowserRouter`）
- 执行 `npm run build` 后重启 PM2

### 2）数据库迁移报错
- 先执行 `cd backend && npx prisma generate`
- 再执行 `npx prisma migrate dev`

### 3）端口访问
- 前端默认：`5173`
- 后端默认：`3000`
- 前端请求后端地址使用：`http://<当前域名或IP>:3000`

## 文档

- 系统说明书：`docs/system-spec.md`
- 产品说明书：`docs/产品说明书.md`
- 系统操作手册：`docs/系统操作手册.md`

## 最近更新（2026-03-10）

- 新增「配置 -> 系统配置」管理页
- 支持系统名称/标题/Logo/Footer 配置
- 系统配置支持 Logo 上传（base64），优先级：上传 Logo > logoUrl > 默认 Motila
- 顶部用户信息展示优化为头像 + 昵称（下拉操作保留）
- 用户管理支持头像字段（avatarUrl），列表/详情页展示
- 生效规则：同一时间仅一个有效配置
- 有效配置可驱动左侧 Logo、顶部标题、浏览器标题与 Footer
- 新增权限点：`settings.read`、`settings.update`

## 已完成搭建

- [x] 创建统一工程目录（frontend/backend/docs/scripts）
- [x] 初始化前端 Vite React-TS 工程
- [x] 安装 Refine + Ant Design 核心依赖
- [x] 初始化后端 NestJS 工程
- [x] 安装 Prisma 并完成 `prisma init`
- [x] 完成认证模块（注册/登录/JWT）
- [x] 完成用户管理 API（管理员可查看/创建/编辑/删除）
- [x] 完成用户管理 UI（Refine + Ant Design）
- [x] 增加安全保护（禁止删除自己、至少保留一个管理员）

### 一键启动（推荐）

```bash
# 在 Motila 根目录
npm install
npm run dev:all
```

### 分开启动

前端：

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

后端：

```bash
cd backend
npm install
npm run start
```

### 数据库（Prisma）

开发环境默认使用 SQLite（`backend/dev.db`），首次拉起可执行：

```bash
cd backend
npx prisma migrate dev --name init_sqlite
```

## 下一步建议

1. 在后端定义核心实体（如：客户、联系人、跟进记录）
2. 生成 Prisma migration 并落库
3. 前端按资源建立 List / Create / Edit / Show 页面
4. 统一主题与设计规范（Ant Design Token + Refine 资源路由）
