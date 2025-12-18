import { detectFrameworks } from './frameworkDetection';

import type { DetectionResult, FrameworkDetection, LuminanceSample, SiteThemeTendency } from '@/types/theme';

/**
 * Sample selectors used to detect page theme from background and text colors
 * Targets both semantic HTML and common framework containers
 */
const SAMPLE_SELECTORS = ['body', 'main', 'header', 'section', 'article', '#app', '.app'];

/**
 * Parse CSS color string into RGB components
 * Supports hex (#fff, #ffffff) and rgb/rgba() formats
 * @param color CSS color string
 * @returns Object with r, g, b (0-255) or null if unparseable
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color) return null;

  const hexMatch = color.match(/^#([\da-f]{3,8})$/i);
  if (hexMatch) {
    const [, hex] = hexMatch;
    const isShort = hex.length <= 4;
    // Short hex (#fff) needs to be expanded (#ffffff)
    const expand = (value: string) => (isShort ? value + value : value);
    const r = parseInt(expand(hex.slice(0, isShort ? 1 : 2)), 16);
    const g = parseInt(expand(hex.slice(isShort ? 1 : 2, isShort ? 2 : 4)), 16);
    const b = parseInt(expand(hex.slice(isShort ? 2 : 4, isShort ? 3 : 6)), 16);
    return { r, g, b };
  }

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    // Extract first 3 values (R, G, B) and ignore alpha if present
    const [r, g, b] = rgbMatch[1]
      .split(',')
      .slice(0, 3)
      .map((v) => parseFloat(v.trim()));
    return { r, g, b };
  }

  return null;
}

/**
 * Calculate relative luminance of a color (WCAG 2.0 formula)
 * Used to determine if a page uses light or dark theme
 * 0 = darkest, 1 = lightest
 * @param color CSS color string
 * @returns Luminance value 0-1
 */
export function computeLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 1;

  // WCAG formula: linearize RGB values then apply luminance weights
  const normalize = (channel: number) => {
    const c = channel / 255;
    // Linearize sRGB: values below ~4% use simple division, rest use gamma curve
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);

  // WCAG weights: green contributes most to perceived brightness (0.7152)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Classify luminance value to theme tendency
 * Dark < 0.45, Light > 0.65, Mixed = in between
 * @param average Average luminance across page samples
 * @returns 'dark' | 'light' | 'mixed'
 */
function classifyTendency(average: number): SiteThemeTendency {
  if (average < 0.45) return 'dark';
  if (average > 0.65) return 'light';
  return 'mixed';
}

/**
 * Collect background and text color samples from key page elements
 * Samples standard semantic elements plus framework-specific containers
 * @param doc Document to sample colors from
 * @returns Array of color samples with computed luminance
 */
function collectSamples(doc: Document): LuminanceSample[] {
  const samples: LuminanceSample[] = [];
  SAMPLE_SELECTORS.forEach((selector) => {
    const el = doc.querySelector(selector);
    if (!el) return;
    const style = getComputedStyle(el);
    // Background color determines theme - use background property if color not set
    const background = style.backgroundColor || style.background || '#ffffff';
    const color = style.color || '#000000';
    const luminance = computeLuminance(background);
    samples.push({ selector, background, color, luminance });
  });
  return samples;
}

/**
 * Analyze page colors and framework to determine if it has light/dark/mixed theme
 * First step of the theme pipeline - determines whether to apply light or dark theme
 * @param doc Document to analyze (defaults to current page)
 * @returns Detection result with luminance, tendency, color samples, and frameworks
 */
export function detectTheme(doc: Document = document): DetectionResult {
  const samples = collectSamples(doc);
  // Average luminance across all sampled elements
  const averageLuminance = samples.length
    ? samples.reduce((sum, sample) => sum + sample.luminance, 0) / samples.length
    : 1;
  const frameworks: FrameworkDetection = detectFrameworks(doc);

  return {
    averageLuminance,
    tendency: classifyTendency(averageLuminance),
    samples,
    frameworks,
  };
}
