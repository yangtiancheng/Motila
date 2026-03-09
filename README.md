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

## 文档

- 系统说明书：`docs/system-spec.md`

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
