import { Button, Typography } from 'antd';

type LandingHeaderNavItem = {
  key: string;
  label: string;
  onClick?: () => void;
};

type PublicHeaderProps = {
  kicker?: string;
  title?: string;
  navItems?: LandingHeaderNavItem[];
  actionLabel: string;
  onAction: () => void;
  onBrandClick?: () => void;
};

export function PublicHeader({ kicker, title, navItems = [], actionLabel, onAction, onBrandClick }: PublicHeaderProps) {
  return (
    <header className="landing-header landing-header-glass">
      <button type="button" className="landing-brand-button" onClick={onBrandClick}>
        {kicker ? <Typography.Text className="landing-kicker">{kicker}</Typography.Text> : null}
        {title ? (
          <Typography.Title level={2} className="landing-brand-heading">
            {title}
          </Typography.Title>
        ) : null}
      </button>

      <nav className="landing-nav">
        {navItems.map((item) => (
          <button key={item.key} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </nav>

      <Button size="large" type="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    </header>
  );
}
