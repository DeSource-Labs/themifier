/**
 * Extension UI Theme Definitions
 * Premium styling for the Themifier extension interface across all theme variants
 */

export interface ExtensionTheme {
  id: string;

  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgGradient: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent colors
  accent: string;
  accentLight: string;
  accentDark: string;

  // Interactive states
  hoverBg: string;
  activeBg: string;
  borderColor: string;
  borderHover: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Glassmorphism
  glassOpacity: number;
  glassBlur: string;

  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // Special properties
  reducedMotion?: boolean;
}

export const extensionThemes: Record<string, ExtensionTheme> = {
  // Current dark theme (baseline)
  dark: {
    id: 'dark',
    bgPrimary: '#0f1419',
    bgSecondary: '#1a1f2e',
    bgGradient: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
    textPrimary: '#e8ecf1',
    textSecondary: '#c1c9d2',
    textMuted: '#8b92b0',
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4f46e5',
    hoverBg: 'rgba(99, 102, 241, 0.1)',
    activeBg: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.12)',
    borderHover: 'rgba(99, 102, 241, 0.25)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(99, 102, 241, 0.15)',
    shadowLg: '0 8px 24px rgba(99, 102, 241, 0.15)',
  },

  // Premium light theme
  light: {
    id: 'light',
    bgPrimary: '#ffffff',
    bgSecondary: '#f8f9fa',
    bgGradient: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    textPrimary: '#1a202c',
    textSecondary: '#4a5568',
    textMuted: '#718096',
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4f46e5',
    hoverBg: 'rgba(99, 102, 241, 0.08)',
    activeBg: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderHover: 'rgba(99, 102, 241, 0.3)',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    glassOpacity: 0.06,
    glassBlur: '12px',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    shadowMd: '0 4px 12px rgba(99, 102, 241, 0.12)',
    shadowLg: '0 8px 24px rgba(99, 102, 241, 0.18)',
  },

  // High contrast for accessibility
  'high-contrast': {
    id: 'high-contrast',
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgGradient: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#f0f0f0',
    textMuted: '#cccccc',
    accent: '#ffd60a',
    accentLight: '#ffe34a',
    accentDark: '#d4b000',
    hoverBg: 'rgba(0, 212, 255, 0.15)',
    activeBg: 'rgba(0, 212, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderHover: 'rgba(0, 212, 255, 0.5)',
    success: '#00ff88',
    warning: '#ffcc00',
    error: '#ff3366',
    info: '#00d4ff',
    glassOpacity: 0.1,
    glassBlur: '8px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.8)',
    shadowMd: '0 4px 16px rgba(0, 212, 255, 0.3)',
    shadowLg: '0 8px 32px rgba(0, 212, 255, 0.4)',
  },

  // Night warm - reduced blue light
  'night-warm': {
    id: 'night-warm',
    bgPrimary: '#1b140f',
    bgSecondary: '#251912',
    bgGradient: 'linear-gradient(135deg, #1b140f 0%, #251912 100%)',
    textPrimary: '#f2e8de',
    textSecondary: '#d4c4b7',
    textMuted: '#a49387',
    accent: '#d97757',
    accentLight: '#e89577',
    accentDark: '#c05937',
    hoverBg: 'rgba(255, 149, 87, 0.12)',
    activeBg: 'rgba(255, 149, 87, 0.2)',
    borderColor: 'rgba(255, 149, 87, 0.15)',
    borderHover: 'rgba(255, 149, 87, 0.3)',
    success: '#b8a76f',
    warning: '#f4a460',
    error: '#e57373',
    info: '#ffb380',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    shadowMd: '0 4px 12px rgba(255, 149, 87, 0.15)',
    shadowLg: '0 8px 24px rgba(255, 149, 87, 0.2)',
  },

  // Protanopia (red-blind) - avoid red/green confusion
  'colorblind-protanopia': {
    id: 'colorblind-protanopia',
    bgPrimary: '#1a1f2e',
    bgSecondary: '#1f2433',
    bgGradient: 'linear-gradient(135deg, #1a1f2e 0%, #1f2433 100%)',
    textPrimary: '#e8e6e3',
    textSecondary: '#c1c9d2',
    textMuted: '#8b92b0',
    accent: '#60a5fa', // Blue (safe)
    accentLight: '#93c5fd',
    accentDark: '#3b82f6',
    hoverBg: 'rgba(59, 130, 246, 0.1)',
    activeBg: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.12)',
    borderHover: 'rgba(59, 130, 246, 0.25)',
    success: '#facc15', // Yellow instead of green
    warning: '#f97316', // Orange
    error: '#14b8a6', // Cyan instead of red
    info: '#3b82f6',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(59, 130, 246, 0.15)',
    shadowLg: '0 8px 24px rgba(59, 130, 246, 0.15)',
  },

  // Deuteranopia (green-blind) - avoid red/green confusion
  'colorblind-deuteranopia': {
    id: 'colorblind-deuteranopia',
    bgPrimary: '#1a1f2e',
    bgSecondary: '#1f2433',
    bgGradient: 'linear-gradient(135deg, #1a1f2e 0%, #1f2433 100%)',
    textPrimary: '#e8e6e3',
    textSecondary: '#c1c9d2',
    textMuted: '#8b92b0',
    accent: '#fbbf24', // Yellow/amber (safe)
    accentLight: '#fcd34d',
    accentDark: '#f59e0b',
    hoverBg: 'rgba(139, 92, 246, 0.1)',
    activeBg: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.12)',
    borderHover: 'rgba(139, 92, 246, 0.25)',
    success: '#facc15', // Yellow instead of green
    warning: '#f97316', // Orange
    error: '#06b6d4', // Cyan instead of red
    info: '#8b5cf6',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(139, 92, 246, 0.15)',
    shadowLg: '0 8px 24px rgba(139, 92, 246, 0.15)',
  },

  // Tritanopia (blue-blind) - avoid blue/yellow confusion
  'colorblind-tritanopia': {
    id: 'colorblind-tritanopia',
    bgPrimary: '#1a1f2e',
    bgSecondary: '#1f2433',
    bgGradient: 'linear-gradient(135deg, #1a1f2e 0%, #1f2433 100%)',
    textPrimary: '#e8e6e3',
    textSecondary: '#c1c9d2',
    textMuted: '#8b92b0',
    accent: '#ec4899', // Pink (safe)
    accentLight: '#f472b6',
    accentDark: '#db2777',
    hoverBg: 'rgba(236, 72, 153, 0.1)',
    activeBg: 'rgba(236, 72, 153, 0.2)',
    borderColor: 'rgba(236, 72, 153, 0.12)',
    borderHover: 'rgba(236, 72, 153, 0.25)',
    success: '#10b981', // Green (safe)
    warning: '#f43f5e', // Rose
    error: '#ef4444', // Red (safe)
    info: '#ec4899',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(236, 72, 153, 0.15)',
    shadowLg: '0 8px 24px rgba(236, 72, 153, 0.15)',
  },

  // Reduced motion - same as dark but with animation flag
  'reduced-motion': {
    id: 'reduced-motion',
    bgPrimary: '#0f172a',
    bgSecondary: '#111827',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
    textPrimary: '#f8fafc',
    textSecondary: '#c1c9d2',
    textMuted: '#8b92b0',
    accent: '#38bdf8',
    accentLight: '#7dd3fc',
    accentDark: '#0ea5e9',
    hoverBg: 'rgba(99, 102, 241, 0.1)',
    activeBg: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.12)',
    borderHover: 'rgba(99, 102, 241, 0.25)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    glassOpacity: 0.08,
    glassBlur: '10px',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(99, 102, 241, 0.15)',
    shadowLg: '0 8px 24px rgba(99, 102, 241, 0.15)',
    reducedMotion: true,
  },
};

/**
 * Convert theme object to CSS custom properties
 */
export function themeToCSSProperties(theme: ExtensionTheme): Record<string, string> {
  return {
    '--ext-bg-primary': theme.bgPrimary,
    '--ext-bg-secondary': theme.bgSecondary,
    '--ext-bg-gradient': theme.bgGradient,
    '--ext-text-primary': theme.textPrimary,
    '--ext-text-secondary': theme.textSecondary,
    '--ext-text-muted': theme.textMuted,
    '--ext-accent': theme.accent,
    '--ext-accent-light': theme.accentLight,
    '--ext-accent-dark': theme.accentDark,
    '--ext-hover-bg': theme.hoverBg,
    '--ext-active-bg': theme.activeBg,
    '--ext-border-color': theme.borderColor,
    '--ext-border-hover': theme.borderHover,
    '--ext-success': theme.success,
    '--ext-warning': theme.warning,
    '--ext-error': theme.error,
    '--ext-info': theme.info,
    '--ext-glass-opacity': theme.glassOpacity.toString(),
    '--ext-glass-blur': theme.glassBlur,
    '--ext-shadow-sm': theme.shadowSm,
    '--ext-shadow-md': theme.shadowMd,
    '--ext-shadow-lg': theme.shadowLg,
    '--ext-transition-speed': theme.reducedMotion ? '0ms' : '200ms',
  };
}
