import { App as AntdApp } from 'antd';
import { useMemo } from 'react';

import './LandingPage.css';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

type LandingPageProps = {
  systemName: string;
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

export function LandingPage({ systemName, primaryColor, footerText, onStart, onOpenBlog }: LandingPageProps) {
  const { message } = AntdApp.useApp();
  const comingSoon = () => message.info('正在火速开发中...');
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
        <PublicHeader
          kicker={systemName}
          onBrandClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          navItems={[
            { key: 'blog', label: '博文', onClick: onOpenBlog },
            { key: 'docs', label: '文档', onClick: comingSoon },
            { key: 'community', label: '社区', onClick: comingSoon },
          ]}
          actionLabel="进入系统"
          onAction={onStart}
        />

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

        <PublicFooter footerText={footerText} />
      </div>
    </div>
  );
}
