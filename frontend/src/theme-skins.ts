import type { ThemeConfig } from 'antd';

export type ResolvedSkin = 'business' | 'tech' | 'dark';
export type SkinMode = ResolvedSkin | 'auto';

export type BrandingConfig = {
  primaryColor: string;
};

export const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#2563eb',
};

export const skinOptions: Array<{ label: string; value: SkinMode }> = [
  { label: '跟随系统', value: 'auto' },
  { label: '商务蓝', value: 'business' },
  { label: '科技紫', value: 'tech' },
  { label: '暗夜黑', value: 'dark' },
];

const baseThemeMap: Record<ResolvedSkin, ThemeConfig> = {
  business: {
    token: {
      colorPrimary: '#2563eb',
      borderRadius: 10,
      colorLink: '#2563eb',
    },
  },
  tech: {
    token: {
      colorPrimary: '#7c3aed',
      borderRadius: 12,
      colorLink: '#7c3aed',
    },
  },
  dark: {
    token: {
      colorPrimary: '#8b5cf6',
      borderRadius: 12,
      colorLink: '#a78bfa',
      colorBgBase: '#0b1020',
      colorBgContainer: '#111827',
      colorText: '#e5e7eb',
      colorTextSecondary: '#94a3b8',
      colorBorder: '#334155',
    },
  },
};

export function getInitialSkin(): SkinMode {
  const saved = localStorage.getItem('motila_skin');
  if (saved === 'auto' || saved === 'business' || saved === 'tech' || saved === 'dark') {
    return saved;
  }
  return 'business';
}

export function getInitialBranding(): BrandingConfig {
  const saved = localStorage.getItem('motila_branding');

  if (!saved) return DEFAULT_BRANDING;

  try {
    const parsed = JSON.parse(saved) as Partial<BrandingConfig>;
    if (parsed?.primaryColor && /^#([0-9a-fA-F]{6})$/.test(parsed.primaryColor)) {
      return {
        primaryColor: parsed.primaryColor,
      };
    }
  } catch {
    // ignore invalid localStorage data
  }

  return DEFAULT_BRANDING;
}

export function resolveEffectiveSkin(mode: SkinMode, systemPrefersDark: boolean): ResolvedSkin {
  if (mode === 'auto') {
    return systemPrefersDark ? 'dark' : 'business';
  }
  return mode;
}

export function getThemeBySkin(
  skin: ResolvedSkin,
  branding: BrandingConfig,
): ThemeConfig {
  const base = baseThemeMap[skin];

  return {
    ...base,
    token: {
      ...(base.token ?? {}),
      colorPrimary: branding.primaryColor,
      colorLink: branding.primaryColor,
    },
  };
}
