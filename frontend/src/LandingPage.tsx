import { Button, Typography } from 'antd';

import './LandingPage.css';

type LandingPageProps = {
  systemTitle: string;
  primaryColor: string;
  footerText: string;
  onStart: () => void;
  onOpenBlog: () => void;
};

function renderFooterContent(text: string) {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : text;
}

export function LandingPage({ systemTitle, primaryColor, footerText, onStart, onOpenBlog }: LandingPageProps) {
  return (
    <div className="landing-page landing-home-page" style={{ ['--landing-primary' as string]: primaryColor }}>
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />
      <div className="landing-backdrop landing-backdrop-d" />

      <div className="landing-container landing-home-shell">
        <header className="landing-header landing-header-glass">
          <div>
            <Typography.Text className="landing-kicker">WELCOME</Typography.Text>
            <Typography.Title level={2} className="landing-brand-heading">
              {systemTitle}
            </Typography.Title>
          </div>

          <nav className="landing-nav">
            <button type="button" onClick={onOpenBlog}>博文</button>
            <button type="button">文档</button>
            <button type="button">社区</button>
            <button type="button" onClick={onStart}>登录</button>
          </nav>

          <Button size="large" type="primary" onClick={onStart}>
            立即开始
          </Button>
        </header>

        <section className="landing-home-hero">
          <Typography.Text className="landing-kicker">HELLO</Typography.Text>
          <Typography.Title className="landing-home-title">Hello World</Typography.Title>
          <Typography.Paragraph className="landing-home-subtitle">
            首页就保持干净，像你说的，只放一个 Hello World。想看博客，点上面的「博文」再跳过去，别在首页上乱炖。
          </Typography.Paragraph>
          <div className="landing-home-actions">
            <Button type="primary" size="large" onClick={onOpenBlog}>去看博文</Button>
            <Button size="large" onClick={onStart}>进入系统</Button>
          </div>
        </section>

        <footer className="landing-footer landing-footer-plain landing-footer-rich">
          <Typography.Text>{renderFooterContent(footerText)}</Typography.Text>
        </footer>
      </div>
    </div>
  );
}
