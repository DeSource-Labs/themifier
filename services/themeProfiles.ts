import type { ThemeProfile, ThemeId, UserSettings, ColorBlindnessMode } from '@/types/theme';

export const themeProfiles: ThemeProfile[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright background with dark text for well-lit environments.',
    palette: {
      background: '#dcdad7',
      surface: '#f5f5f5',
      text: '#181a1b',
      accent: '#2563eb',
    },
    minimumContrast: 4.5,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dimmed background for low-light readability.',
    palette: {
      background: '#181a1b',
      surface: '#1c1e1f',
      text: '#e8e6e3',
      accent: '#60a5fa',
    },
    filters: { brightness: 1.0, contrast: 1.0 },
    minimumContrast: 4.5,
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum contrast for accessibility and sharp edges.',
    palette: {
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      accent: '#ffd60a',
    },
    filters: { contrast: 1.1, brightness: 1 },
    minimumContrast: 7,
  },
  {
    id: 'night-warm',
    label: 'Night Warm',
    description: 'Low blue light mode to reduce eye strain.',
    palette: {
      background: '#1b140f',
      surface: '#251912',
      text: '#f2e8de',
      accent: '#d97757',
    },
    filters: { sepia: 0.2 },
    minimumContrast: 4.5,
  },
  {
    id: 'colorblind-protanopia',
    label: 'Protanopia',
    description: 'Adjusted hues for red-blind accessibility.',
    palette: {
      background: '#1a1f2e',
      surface: '#1f2433',
      text: '#e8e6e3',
      accent: '#60a5fa', // Blue - safe for red-blind (blue-yellow axis)
    },
    filters: { saturate: 1.1, contrast: 1.05 },
    minimumContrast: 4.5,
  },
  {
    id: 'colorblind-deuteranopia',
    label: 'Deuteranopia',
    description: 'Adjusted hues for green-blind accessibility.',
    palette: {
      background: '#1a1f2e',
      surface: '#1f2433',
      text: '#e8e6e3',
      accent: '#fbbf24', // Yellow/amber - safe for green-blind (blue-yellow axis)
    },
    filters: { saturate: 1.1, contrast: 1.05 },
    minimumContrast: 4.5,
  },
  {
    id: 'colorblind-tritanopia',
    label: 'Tritanopia',
    description: 'Adjusted hues for blue-blind accessibility.',
    palette: {
      background: '#1a1f2e',
      surface: '#1f2433',
      text: '#e8e6e3',
      accent: '#ec4899', // Pink/magenta - safe for blue-blind (red-green axis)
    },
    filters: { saturate: 1.0, contrast: 1.05 },
    minimumContrast: 4.5,
  },
  {
    id: 'reduced-motion',
    label: 'Reduced Motion',
    description: 'Disables motion-heavy effects while retaining neutral colors.',
    palette: {
      background: '#0f172a',
      surface: '#111827',
      text: '#f8fafc',
      accent: '#38bdf8',
    },
    reducedMotion: true,
    minimumContrast: 4.5,
  },
];

export function getThemeProfile(id: string): ThemeProfile | undefined {
  return themeProfiles.find((profile) => profile.id === id);
}

const colorBlindFilters: Record<ColorBlindnessMode, ThemeProfile['filters']> = {
  none: undefined,
  protanopia: { hueRotate: 10, saturate: 0.9, contrast: 1.05 },
  deuteranopia: { hueRotate: -10, saturate: 0.9, contrast: 1.05 },
  tritanopia: { hueRotate: 35, saturate: 0.85, contrast: 1.05 },
};

export function resolveProfile(theme: ThemeId, settings: UserSettings): ThemeProfile | undefined {
  const base = getThemeProfile(theme);
  if (!base) return undefined;

  const filters = {
    ...base.filters,
    ...colorBlindFilters[settings.colorBlindness],
  };

  return {
    ...base,
    filters,
    reducedMotion: settings.preferReducedMotion || base.reducedMotion,
  };
}
