import { App as AntdApp, Button, Typography } from 'antd';

type LandingPageProps = {
  systemTitle: string;
  primaryColor: string;
  onStart: () => void;
};

const quickLinks = ['博文', '文档', '社区'] as const;

export function LandingPage({ primaryColor, onStart }: LandingPageProps) {
  const { message } = AntdApp.useApp();

  const showComingSoon = () => {
    message.info('暂未开放，先别急。');
  };

  return (
    <div className="landing-page" style={{ ['--landing-primary' as string]: primaryColor }}>
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />
      <div className="landing-backdrop landing-backdrop-c" />
      <div className="landing-backdrop landing-backdrop-d" />
      <div className="landing-backdrop landing-backdrop-e" />

      <div className="landing-container landing-container-fluid">
        <header className="landing-header">
          <div>
            <Typography.Text className="landing-kicker">MOTILA</Typography.Text>
          </div>

          <nav className="landing-nav">
            {quickLinks.map((item) => (
              <button key={item} type="button" onClick={showComingSoon}>{item}</button>
            ))}
          </nav>

          <Button size="large" type="primary" onClick={onStart}>
            立即开始
          </Button>
        </header>

        <section className="landing-reborn landing-reborn-terminal-only">
          <div className="landing-reborn-visual" aria-hidden="true">
            <div className="landing-terminal-card">
              <div className="landing-terminal-head">
                <span className="landing-panel-dot dot-red" />
                <span className="landing-panel-dot dot-yellow" />
                <span className="landing-panel-dot dot-green" />
                <strong></strong>
              </div>
              <div className="landing-terminal-body">
                <div className="landing-terminal-orbit orbit-a" />
                <div className="landing-terminal-orbit orbit-b" />
                <div className="landing-terminal-grid" />
                <div className="landing-terminal-line dim">Welcome to Motila.</div>
                <div className="landing-terminal-line success typewriter terminal-line-hello">Hello World.</div>
                <div className="landing-terminal-cursor" />
              </div>
            </div>
          </div>
        </section>

        <footer className="landing-footer landing-footer-plain">
          <Typography.Text>
            Copyright © 2026 Motila. All rights reserved.
          </Typography.Text>
        </footer>
      </div>
    </div>
  );
}
