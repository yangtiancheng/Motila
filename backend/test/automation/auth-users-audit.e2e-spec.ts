import { execSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
  };
};

describe('Automation E2E: Auth + Users + AuditLogs', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'file:./test-automation.db';

    execSync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: 'file:./test-automation.db',
      },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const register = async (payload: { username: string; email: string; name: string; password: string }) => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    return response.body as AuthResponse;
  };

  const login = async (payload: { username: string; password: string }) => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(201);

    return response.body as AuthResponse;
  };

  it('首个注册用户为 ADMIN，后续注册为 USER', async () => {
    const first = await register({
      username: 'admin',
      email: 'admin@test.com',
      name: 'Admin',
      password: '123456',
    });

    const second = await register({
      username: 'user01',
      email: 'user@test.com',
      name: 'User',
      password: '123456',
    });

    expect(first.user.role).toBe('ADMIN');
    expect(second.user.role).toBe('USER');
  });

  it('管理员创建/更新/删除用户会生成审计日志', async () => {
    const admin = await register({
      username: 'admin',
      email: 'admin@test.com',
      name: 'Admin',
      password: '123456',
    });

    const createRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        username: 'staff01',
        email: 'staff@test.com',
        name: 'Staff',
        password: '123456',
        role: 'USER',
      })
      .expect(201);

    const targetId = createRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/users/${targetId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Staff Updated' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/users/${targetId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'ADMIN' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/users/${targetId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ password: '654321' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/users/${targetId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const auditRes = await request(app.getHttpServer())
      .get('/audit-logs?limit=20')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const actions = (auditRes.body as Array<{ action: string }>).map((item) => item.action);

    expect(actions).toEqual(
      expect.arrayContaining([
        'USER_CREATE',
        'USER_UPDATE',
        'USER_ROLE_CHANGE',
        'USER_PASSWORD_RESET',
        'USER_DELETE',
      ]),
    );
  });

  it('普通用户不能访问审计日志；管理员保护规则生效', async () => {
    const admin = await register({
      username: 'admin',
      email: 'admin@test.com',
      name: 'Admin',
      password: '123456',
    });

    await register({
      username: 'user01',
      email: 'user@test.com',
      name: 'User',
      password: '123456',
    });

    const userLogin = await login({
      username: 'user01',
      password: '123456',
    });

    await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${userLogin.token}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'USER' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(403);
  });
});
