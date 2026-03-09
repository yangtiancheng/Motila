# 自动化测试说明

这个目录用于放置 Motila 的自动化测试（e2e）。

## 当前覆盖

- `auth-users-audit.e2e-spec.ts`
  - 首个注册用户自动成为 `ADMIN`
  - 后续注册用户默认为 `USER`
  - 管理员对用户的创建/更新/角色变更/密码重置/删除会写入审计日志
  - 普通用户无法访问审计日志
  - 自删/自降级等管理员保护规则生效

## 运行方式

```bash
cd backend
npm run test:e2e
```

> 说明：测试使用独立数据库 `test-automation.db`（SQLite）。
