export type ThemeId =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'night-warm'
  | 'colorblind-protanopia'
  | 'colorblind-deuteranopia'
  | 'colorblind-tritanopia'
  | 'reduced-motion';

export type ThemeIdWithAuto = ThemeId | 'system-auto';

export type SiteThemeTendency = 'light' | 'dark' | 'mixed';

export type ColorBlindnessMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ThemeFilters {
  brightness?: number; // 1 is neutral
  contrast?: number; // 1 is neutral
  hueRotate?: number; // degrees
  saturate?: number; // 1 is neutral
  sepia?: number; // 0..1
  grayscale?: number; // 0..1
  invert?: number; // 0..1
}

export interface ThemePalette {
  background: string;
  text: string;
  surface: string;
  accent: string;
}

export interface ThemeProfile {
  id: ThemeId;
  label: string;
  description: string;
  palette: ThemePalette;
  filters?: ThemeFilters;
  reducedMotion?: boolean;
  minimumContrast?: number; // WCAG ratio target
}

export interface FrameworkDetection {
  tailwind: boolean;
  bootstrap: boolean;
  cssVariables: boolean;
}

export interface LuminanceSample {
  selector: string;
  background: string;
  color: string;
  luminance: number;
}

export interface DetectionResult {
  averageLuminance: number;
  tendency: SiteThemeTendency;
  samples: LuminanceSample[];
  frameworks: FrameworkDetection;
}

export interface SitePreference {
  enforcedTheme?: ThemeId;
  isExcluded?: boolean;
  lastDetection?: DetectionResult;
  lastUpdated?: number;
  advancedDynamic?: boolean;
}

export interface UserSettings {
  globalTheme: ThemeIdWithAuto;
  colorBlindness: ColorBlindnessMode;
  preferReducedMotion: boolean;
  enableAutoDetect: boolean;
  perSite: Record<string, SitePreference>;
}
