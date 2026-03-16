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

export function LandingPage({ systemTitle: _systemTitle, primaryColor, footerText, onStart, onOpenBlog }: LandingPageProps) {
  return (
    <div className="landing-page landing-home-page" style={{ ['--landing-primary' as string]: primaryColor }}>
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />
      <div className="landing-backdrop landing-backdrop-d" />

      <div className="landing-container landing-home-shell">
        <header className="landing-header landing-header-glass landing-header-simple">
          <nav className="landing-nav">
            <button type="button" onClick={onOpenBlog}>博文</button>
            <button type="button">文档</button>
            <button type="button">社区</button>
          </nav>
        </header>

        <section className="landing-home-hero">
          <div className="landing-terminal-shell" aria-label="terminal welcome animation">
            <div className="landing-terminal-head">
              <span className="landing-terminal-dot red" />
              <span className="landing-terminal-dot yellow" />
              <span className="landing-terminal-dot green" />
            </div>
            <div className="landing-terminal-body">
              <span className="landing-terminal-prompt">&gt;_</span>
              <span className="landing-terminal-typewriter">WELCOME TO MOTILA.</span>
            </div>
          </div>

          <Typography.Title className="landing-home-title">Hello World</Typography.Title>
          <div className="landing-home-actions">
            <Button type="primary" size="large" onClick={onStart}>进入系统</Button>
          </div>
        </section>

        <footer className="landing-footer landing-footer-plain landing-footer-rich">
          <Typography.Text>{renderFooterContent(footerText)}</Typography.Text>
        </footer>
      </div>
    </div>
  );
}
