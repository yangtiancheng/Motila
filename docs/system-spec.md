# Motila 系统说明书（v0.2）

> 更新时间：2026-03-09
> 状态：可用版本（认证 + 用户管理 + 皮肤系统）

## 1. 系统目标

Motila 是一个面向“关系管理”场景的综合系统，目标是提供：

- 统一的数据管理入口（List）
- 标准化的数据录入与编辑界面（Form）
- 可追溯的实体详情视图（Detail/Show）
- 一致的视觉与交互规范

首期重点围绕「客户 / 联系人 / 跟进记录」三类核心实体搭建。

---

## 2. 技术架构

### 2.1 前端

- React 19
- Vite 7
- TypeScript
- Refine（企业后台 CRUD 框架）
- Ant Design（统一 UI 风格）
- 可配置皮肤系统（商务蓝 / 科技紫 / 暗夜黑 / 跟随系统）

### 2.2 后端

- NestJS 11
- TypeScript

### 2.3 数据层

- Prisma ORM
- SQLite（开发环境，后续可切换 PostgreSQL）

---

## 3. 工程目录说明

```text
Motila/
├─ frontend/                 # 前端管理台（Refine + AntD）
├─ backend/                  # 后端 API（NestJS）
│  ├─ prisma/                # Prisma schema 与迁移相关
│  └─ src/                   # 后端业务代码
├─ docs/                     # 系统文档
│  └─ system-spec.md         # 本说明书
├─ scripts/                  # 自动化脚本
└─ README.md                 # 工程总览与启动说明
```

---

## 4. 功能范围（首期）

### 4.1 实体模型（规划）

1. 客户（Customer）
   - 基本信息：名称、等级、来源、状态
   - 业务信息：行业、地区、备注

2. 联系人（Contact）
   - 归属客户
   - 基本信息：姓名、电话、邮箱、职位

3. 跟进记录（FollowUp）
   - 关联客户/联系人
   - 跟进类型、沟通内容、下次跟进时间、负责人

### 4.2 页面类型

- Dashboard 页面：概览信息与快捷入口
- List 页面：查询、筛选、分页、排序
- Form 页面：创建、编辑、字段校验
- Detail 页面：查看完整数据与关联信息
- 菜单页框架：侧边菜单 + 顶部面包屑 + 内容区

---

## 5. 一致性规范

### 5.1 UI 风格

- 统一使用 Ant Design 组件
- 全局主题通过 Ant Design Token 管理
- 支持皮肤切换（商务蓝/科技紫/暗夜黑/跟随系统）
- 支持品牌色实时配置（ColorPicker，结果持久化）
- 支持主题配置导入/导出（JSON，便于跨环境复用）
- 皮肤配置集中在 `frontend/src/theme-skins.ts`，便于后续增减和统一改色
- 统一间距、字号、按钮风格、表单布局

### 5.2 页面交互约定

- 列表页统一采用：筛选区 + 表格区 + 分页
- 新建/编辑共用同一套 Form 组件
- 错误提示统一 toast + 表单字段提示

### 5.3 命名约定

- 前端路由资源名与后端模块名保持一致
- Prisma model 命名使用 PascalCase
- API 路径使用 kebab-case

---

## 6. API 与数据策略（初版）

- 后端采用 REST 风格接口
- 前端通过 Refine dataProvider 对接 REST API
- Prisma 负责数据库访问与迁移管理
- 后续补充：鉴权、权限控制、审计日志

---

## 7. 运行与开发

### 7.1 前端

```bash
cd frontend
npm run dev
```

### 7.2 后端

```bash
cd backend
npm run start:dev
```

### 7.3 数据库

在 `backend/.env` 配置 `DATABASE_URL` 后执行：

```bash
cd backend
npx prisma migrate dev --name init
npx prisma studio
```

---

## 8. 已完成项

- [x] 登录后白屏修复（前端入口补充 BrowserRouter，修复路由上下文缺失）
- [x] 工程目录初始化
- [x] 前端脚手架初始化（Vite React TS）
- [x] Refine + AntD 依赖安装
- [x] 后端脚手架初始化（NestJS）
- [x] Prisma 初始化
- [x] 登录/注册/JWT 认证
- [x] 用户管理 CRUD（管理员）
- [x] 安全保护策略（禁止删自己、保留最后管理员）
- [x] 皮肤系统（商务蓝/科技紫/暗夜黑/跟随系统，可扩展）
- [x] 品牌色配置入口（实时换色+本地持久化）
- [x] 通用后台骨架（菜单 + 面包屑 + 内容区）
- [x] 用户列表页通用能力（搜索/筛选/分页）
- [x] 通用表单管理基础版（Schema 驱动，Create/Edit 复用）
- [x] 表单引擎增强（字段可见性/禁用条件 + 提交前 transform）
- [x] 页面搜索 schema 化（SchemaQueryBar）+ 通用列表查询参数构建（buildListQuery）
- [x] 列表状态管理标准化（useListState：filters/page/pageSize 统一状态模型）
- [x] 管理员审计日志（AuditLog 模型、用户变更事件记录、审计日志页面）

## 9. 待办项（下一阶段）

- [ ] 定义 Customer / Contact / FollowUp Prisma Schema
- [ ] 完成后端 CRUD API
- [ ] 完成前端 List/Form/Detail 三类页面
- [ ] 接入统一错误处理与日志策略
- [ ] 增加基础权限模型（角色/资源）


## 测试与质量

- 后端 E2E：
  - `test/app.e2e-spec.ts`：健康检查接口
  - `test/automation/auth-users-audit.e2e-spec.ts`：认证/用户管理/审计日志全链路
- 运行命令：`cd backend && npm run test:e2e`
- 自动化测试目录：`backend/test/automation/`

