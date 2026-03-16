import { Button, Typography } from 'antd';
import { useMemo } from 'react';

import './LandingPage.css';

type LandingPageProps = {
  systemTitle: string;
  logoSrc?: string;
  primaryColor: string;
  footerText: string;
  onStart: () => void;
  onOpenBlog: () => void;
};

type LandingBackdropPalette = {
  pageBackground: string;
  glowA: string;
  glowB: string;
  glowD: string;
};

const LANDING_BACKDROP_PALETTES: LandingBackdropPalette[] = [
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #ffffff 55%, #f8fafc 100%)',
    glowA: '#2563eb',
    glowB: '#8b5cf6',
    glowD: '#38bdf8',
  },
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(14, 165, 233, 0.1), transparent 30%), linear-gradient(180deg, #f5fbff 0%, #ffffff 50%, #ecfeff 100%)',
    glowA: '#0ea5e9',
    glowB: '#14b8a6',
    glowD: '#6366f1',
  },
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(99, 102, 241, 0.09), transparent 30%), linear-gradient(180deg, #f7f7ff 0%, #ffffff 52%, #f5f3ff 100%)',
    glowA: '#6366f1',
    glowB: '#a855f7',
    glowD: '#ec4899',
  },
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(16, 185, 129, 0.08), transparent 28%), linear-gradient(180deg, #f3fffb 0%, #ffffff 54%, #f0fdf4 100%)',
    glowA: '#10b981',
    glowB: '#22c55e',
    glowD: '#2dd4bf',
  },
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 28%), linear-gradient(180deg, #fff8f3 0%, #ffffff 55%, #fffbeb 100%)',
    glowA: '#f97316',
    glowB: '#f59e0b',
    glowD: '#fb7185',
  },
  {
    pageBackground:
      'radial-gradient(circle at top left, rgba(6, 182, 212, 0.08), transparent 28%), linear-gradient(180deg, #f4fcff 0%, #ffffff 55%, #f0f9ff 100%)',
    glowA: '#06b6d4',
    glowB: '#3b82f6',
    glowD: '#8b5cf6',
  },
];

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

export function LandingPage({ systemTitle, logoSrc, primaryColor, footerText, onStart, onOpenBlog }: LandingPageProps) {
  const backdropPalette = useMemo(
    () => LANDING_BACKDROP_PALETTES[Math.floor(Math.random() * LANDING_BACKDROP_PALETTES.length)],
    [],
  );

  return (
    <div
      className="landing-page landing-home-page"
      style={{
        ['--landing-primary' as string]: primaryColor,
        ['--landing-home-background' as string]: backdropPalette.pageBackground,
        ['--landing-backdrop-a' as string]: backdropPalette.glowA,
        ['--landing-backdrop-b' as string]: backdropPalette.glowB,
        ['--landing-backdrop-d' as string]: backdropPalette.glowD,
      }}
    >
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />
      <div className="landing-backdrop landing-backdrop-d" />

      <div className="landing-container landing-home-shell">
        <header className="landing-header landing-header-glass">
          <div className="landing-header-left">
            <div className="landing-header-brand" role="img" aria-label={systemTitle}>
              {logoSrc ? <img src={logoSrc} alt={systemTitle} className="landing-header-logo" /> : <span className="landing-header-logo-fallback">M</span>}
            </div>
          </div>

          <nav className="landing-nav landing-nav-fancy">
            <button type="button" className="landing-nav-chip chip-blog" onClick={onOpenBlog}>博文</button>
            <button type="button" className="landing-nav-chip chip-doc">文档</button>
            <button type="button" className="landing-nav-chip chip-community">社区</button>
          </nav>

          <div className="landing-header-right">
            <Button type="primary" size="large" className="landing-header-action" onClick={onStart}>进入系统</Button>
          </div>
        </header>

        <section className="landing-home-hero">
          <div className="landing-terminal-shell" aria-label="terminal welcome animation">
            <div className="landing-terminal-head">
              <span className="landing-terminal-dot red" />
              <span className="landing-terminal-dot yellow" />
              <span className="landing-terminal-dot green" />
            </div>
            <div className="landing-terminal-body">
              <div className="landing-terminal-line">
                <span className="landing-terminal-prompt">&gt;_</span>
                <span className="landing-terminal-typewriter">WELCOME TO MOTILA.</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="landing-footer landing-footer-plain landing-footer-rich">
          <Typography.Text>{renderFooterContent(footerText)}</Typography.Text>
        </footer>
      </div>
    </div>
  );
}
