import { Button, Card, Col, Row, Space, Tag, Timeline, Typography } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloudServerOutlined,
  LockOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';

type LandingPageProps = {
  systemTitle: string;
  primaryColor: string;
  onLogin: () => void;
  onRegister: () => void;
};

const capabilities = [
  '模块配置 + 权限配置双维控制',
  '用户、角色、菜单、模块一体化管理',
  '支持博客、项目、人事、风控等业务扩展',
  '默认适配后台管理系统快速落地',
];

const highlights = [
  {
    title: '模块化业务中台',
    desc: '模块可启停、可授权、可扩展。新增业务不是硬塞菜单，而是按模块配置和权限动态展示。',
    icon: <RocketOutlined />,
  },
  {
    title: '安全可控',
    desc: '内置登录风控、验证码、登录历史与权限隔离，后台该拦的地方不靠运气。',
    icon: <SafetyCertificateOutlined />,
  },
  {
    title: '开箱即用的管理后台',
    desc: '列表页、详情页、创建页、编辑页统一模式，少折腾样式，多专注业务。',
    icon: <LockOutlined />,
  },
];

const stats = [
  { value: '16+', label: '已接入模块' },
  { value: '3 min', label: '启动体验' },
  { value: 'RBAC', label: '权限体系' },
  { value: '100%', label: '页面化流程' },
];

const scenarios = [
  {
    title: '后台搭建',
    desc: '快速起用户、角色、模块、配置这些基础骨架。',
    icon: <CloudServerOutlined />,
  },
  {
    title: '团队协作',
    desc: '权限边界清楚，谁看什么、谁改什么一眼分明。',
    icon: <TeamOutlined />,
  },
  {
    title: '业务扩展',
    desc: '博客、项目、人事、财务模块都能继续往里长。',
    icon: <ClockCircleOutlined />,
  },
];

const steps = [
  '未登录先看到品牌首页与产品能力说明',
  '点击登录/注册进入悬浮卡片完成认证',
  '登录后按权限进入各模块工作台',
  '模块启停、角色授权、系统配置统一管理',
];

export function LandingPage({ systemTitle, primaryColor, onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="landing-page" style={{ ['--landing-primary' as string]: primaryColor }}>
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />

      <div className="landing-container">
        <header className="landing-header">
          <div>
            <Typography.Text className="landing-kicker">MOTILA</Typography.Text>
            <Typography.Title level={3} className="landing-brand-title">
              {systemTitle}
            </Typography.Title>
          </div>

          <nav className="landing-nav">
            <a href="#highlights">核心能力</a>
            <a href="#scenarios">使用场景</a>
            <a href="#workflow">使用流程</a>
          </nav>

          <Space>
            <Button size="large" onClick={onLogin}>登录</Button>
            <Button size="large" type="primary" onClick={onRegister}>
              立即开始
            </Button>
          </Space>
        </header>

        <section className="landing-hero">
          <div className="landing-hero-copy">
            <Tag color="blue" className="landing-tag">企业管理系统 / Motila</Tag>
            <Typography.Title className="landing-title">
              一个看起来像样、
              <br />
              用起来也不拉胯的后台首页。
            </Typography.Title>
            <Typography.Paragraph className="landing-subtitle">
              未登录直接能看见品牌首页、产品能力和入口说明。登录之后，再进入真正的系统工作台。
              这才像个正经产品，不是上来一坨登录框糊脸上。
            </Typography.Paragraph>

            <Space wrap size={[12, 12]} className="landing-hero-actions">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={onLogin}>
                进入后台
              </Button>
              <Button size="large" onClick={onRegister}>
                注册账号
              </Button>
            </Space>

            <div className="landing-capabilities">
              {capabilities.map((item) => (
                <div key={item} className="landing-capability-item">
                  <CheckCircleFilled />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="landing-stats-row">
              {stats.map((item) => (
                <div key={item.label} className="landing-stat-chip">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="landing-preview-card" bordered={false}>
            <div className="landing-preview-window">
              <div className="landing-preview-sidebar">
                <div className="landing-preview-logo">M</div>
                <div className="landing-preview-menu">
                  <span className="active">仪表盘</span>
                  <span>博客分类</span>
                  <span>博客文章</span>
                  <span>总账管理</span>
                  <span>模块管理</span>
                </div>
              </div>
              <div className="landing-preview-main">
                <div className="landing-preview-topbar">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
                <div className="landing-preview-content">
                  <div className="landing-metric-grid">
                    <div><strong>16</strong><span>启用模块</span></div>
                    <div><strong>128</strong><span>系统用户</span></div>
                    <div><strong>8</strong><span>业务菜单</span></div>
                  </div>
                  <div className="landing-preview-panel">
                    <Typography.Title level={5}>统一的后台交互规范</Typography.Title>
                    <Typography.Paragraph>
                      列表、查看、创建、编辑全走页面模式，交互统一，业务扩展时不容易越写越乱。
                    </Typography.Paragraph>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="landing-highlights" id="highlights">
          <div className="landing-section-head">
            <Typography.Text className="landing-section-kicker">CORE HIGHLIGHTS</Typography.Text>
            <Typography.Title level={2}>核心能力，不靠吹。</Typography.Title>
            <Typography.Paragraph>
              该有的模块化、权限、配置、统一交互模式都给你摆上，后续扩业务不容易写成屎山。
            </Typography.Paragraph>
          </div>
          <Row gutter={[16, 16]}>
            {highlights.map((item) => (
              <Col xs={24} md={8} key={item.title}>
                <Card className="landing-feature-card" bordered={false}>
                  <div className="landing-feature-icon">{item.icon}</div>
                  <Typography.Title level={5}>{item.title}</Typography.Title>
                  <Typography.Paragraph>{item.desc}</Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="landing-scenarios" id="scenarios">
          <div className="landing-section-head">
            <Typography.Text className="landing-section-kicker">SCENARIOS</Typography.Text>
            <Typography.Title level={2}>适合谁用，拿来干嘛。</Typography.Title>
          </div>
          <Row gutter={[16, 16]}>
            {scenarios.map((item) => (
              <Col xs={24} md={8} key={item.title}>
                <Card className="landing-scene-card" bordered={false}>
                  <div className="landing-scene-icon">{item.icon}</div>
                  <Typography.Title level={5}>{item.title}</Typography.Title>
                  <Typography.Paragraph>{item.desc}</Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="landing-workflow" id="workflow">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={12}>
              <div className="landing-section-head landing-section-head-left">
                <Typography.Text className="landing-section-kicker">WORKFLOW</Typography.Text>
                <Typography.Title level={2}>从首页到进系统，路径要顺。</Typography.Title>
                <Typography.Paragraph>
                  我把没登录时的体验重新捋了一遍。先看品牌首页，再通过悬浮登录卡片进后台，观感和路径都顺很多。
                </Typography.Paragraph>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="landing-workflow-card" bordered={false}>
                <Timeline
                  items={steps.map((item) => ({
                    color: 'blue',
                    children: <span>{item}</span>,
                  }))}
                />
              </Card>
            </Col>
          </Row>
        </section>

        <footer className="landing-footer">
          <div>
            <Typography.Title level={4} style={{ marginBottom: 6 }}>准备好了就直接进。</Typography.Title>
            <Typography.Paragraph>
              首页负责让产品看起来像产品，后台负责让事情真的能干。
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Button type="primary" size="large" onClick={onLogin}>进入后台</Button>
            <Button size="large" onClick={onRegister}>创建账号</Button>
          </Space>
        </footer>
      </div>
    </div>
  );
}
