/**
 * CSS Processor for Dynamic Theme Engine
 * Iterates CSS rules and transforms color properties
 */

import { transformCSSColor } from './colorTransform';

import type { ColorType } from './colorTransform';
import type { ThemeProfile } from '@/types/theme';

/**
 * Check if property is a color property that should be transformed
 */
export function isColorProperty(property: string): boolean {
  return (
    (property.includes('color') && property !== '-webkit-print-color-adjust') ||
    property === 'fill' ||
    property === 'stroke' ||
    property === 'stop-color'
  );
}

/**
 * Determine color type from property and context
 */
export function getColorType(property: string, rule: CSSStyleRule): ColorType {
  if (property.includes('background')) {
    // Check if element has mask (icon fonts) - treat as foreground
    const { style } = rule;
    if (
      style.webkitMaskImage ||
      style.mask ||
      (style.getPropertyValue('mask-image') && style.getPropertyValue('mask-image') !== 'none')
    ) {
      return 'text';
    }
    return 'background';
  }

  if (property.includes('border') || property.includes('outline')) {
    // Skip if border is 0px or none
    if (property.startsWith('border') && property !== 'border-color') {
      const borderValue = rule.style.getPropertyValue(property);
      if (borderValue.startsWith('0px') || borderValue === 'none') {
        return 'border'; // Will be skipped by caller
      }
    }
    return 'border';
  }

  // color, fill, stroke, etc.
  return 'text';
}

/**
 * Process a single CSS declaration
 */
export function processDeclaration(
  property: string,
  value: string,
  rule: CSSStyleRule,
  theme: ThemeProfile
): string | null {
  // Skip non-color properties
  if (!isColorProperty(property)) {
    return null;
  }

  // Skip unparseable values
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'inherit' ||
    normalized === 'transparent' ||
    normalized === 'initial' ||
    normalized === 'currentcolor' ||
    normalized === 'none' ||
    normalized === 'unset' ||
    normalized === 'auto'
  ) {
    return null;
  }

  // Handle special cases
  if (property === 'color-scheme') {
    // Override to dark mode
    return 'dark';
  }

  if (property === 'scrollbar-color') {
    // Transform both colors in scrollbar-color
    const parts = value.split(/\s+/);
    if (parts.length === 2) {
      const thumb = transformCSSColor(parts[0], 'text', theme);
      const track = transformCSSColor(parts[1], 'background', theme);
      if (thumb && track) {
        return `${thumb} ${track}`;
      }
    }
    return null;
  }

  if (property === 'background-image' || property === 'list-style-image') {
    // Skip image processing for now - complex async operation
    // Full implementation would analyze images and apply filters
    return null;
  }

  if (property.includes('shadow')) {
    // Transform shadow colors
    return processShadow(value, theme);
  }

  // Standard color property
  const colorType = getColorType(property, rule);
  return transformCSSColor(value, colorType, theme);
}

/**
 * Process shadow property (box-shadow, text-shadow)
 * Transforms color values within shadow declarations
 */
function processShadow(value: string, theme: ThemeProfile): string | null {
  // Shadow format: [inset] <offset-x> <offset-y> <blur-radius> <spread-radius> <color>
  // Simple approach: find color at end and transform it
  const parts = value.trim().split(/\s+/);

  // Find last color-like value
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (
      part.startsWith('#') ||
      part.startsWith('rgb') ||
      part.startsWith('hsl') ||
      /^[a-z]+$/i.test(part) // Named color
    ) {
      const transformed = transformCSSColor(part, 'background', theme);
      if (transformed) {
        parts[i] = transformed;
        return parts.join(' ');
      }
    }
  }

  return null;
}

/**
 * Iterate all CSS rules recursively
 */
export function iterateCSSRules(rules: CSSRuleList | CSSRule[], callback: (rule: CSSStyleRule) => void): void {
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      callback(rule);
    } else if (rule instanceof CSSMediaRule) {
      // Check if media query is for screen
      const media = Array.from(rule.media);
      const isScreen = media.some((m) => m.startsWith('screen') || m.startsWith('all') || m.startsWith('('));
      const isPrint = media.some((m) => m.startsWith('print'));

      if (isScreen && !isPrint) {
        iterateCSSRules(rule.cssRules, callback);
      }
    } else if (rule instanceof CSSSupportsRule) {
      // Check if browser supports the condition
      try {
        if (CSS.supports(rule.conditionText)) {
          iterateCSSRules(rule.cssRules, callback);
        }
      } catch {
        // Skip if conditionText is invalid
      }
    } else if ('cssRules' in rule && rule.cssRules) {
      // Handle @layer, @container, etc.
      iterateCSSRules(rule.cssRules as CSSRuleList, callback);
    }
  }
}

/**
 * Process a stylesheet and return modified CSS
 */
export function processStylesheet(sheet: CSSStyleSheet | null, theme: ThemeProfile): string {
  if (!sheet || !sheet.cssRules) {
    return '';
  }

  const modifiedRules: string[] = [];
  const minContrast = theme.minimumContrast || 4.5;

  try {
    iterateCSSRules(sheet.cssRules, (rule) => {
      const modifiedDeclarations: string[] = [];
      let transformedBg: string | null = null;
      let transformedColor: string | null = null;

      // First pass: transform all properties
      for (const property of Array.from(rule.style)) {
        const value = rule.style.getPropertyValue(property);
        const priority = rule.style.getPropertyPriority(property);

        const modifiedValue = processDeclaration(property, value, rule, theme);

        if (modifiedValue && modifiedValue !== value) {
          const important = priority === 'important' ? ' !important' : '';
          modifiedDeclarations.push(`${property}: ${modifiedValue}${important}`);

          // Track background and color for contrast check
          if (property === 'background-color' || property === 'background') {
            transformedBg = modifiedValue;
          }
          if (property === 'color') {
            transformedColor = modifiedValue;
          }
        }
      }

      // Second pass: check contrast if we have both background and color
      if (transformedBg && transformedColor) {
        const bgRgb = parseColor(transformedBg);
        const colorRgb = parseColor(transformedColor);

        if (bgRgb && colorRgb) {
          const ratio = getContrastRatio(bgRgb, colorRgb);

          if (ratio < minContrast) {
            // Adjust text color for better contrast
            const adjusted = adjustForContrast(colorRgb, bgRgb, minContrast);
            const adjustedHex = rgbToHex(adjusted);

            // Replace the color declaration
            const colorIndex = modifiedDeclarations.findIndex((d) => d.startsWith('color:'));
            if (colorIndex >= 0) {
              const important = modifiedDeclarations[colorIndex].includes('!important') ? ' !important' : '';
              modifiedDeclarations[colorIndex] = `color: ${adjustedHex}${important}`;
            }
          }
        }
      }

      // Only add rule if we have modifications
      if (modifiedDeclarations.length > 0) {
        const ruleText = `${rule.selectorText} { ${modifiedDeclarations.join('; ')} }`;
        modifiedRules.push(ruleText);
      }
    });
  } catch {
    // CORS or invalid CSS - skip this sheet
  }

  return modifiedRules.join('\n');
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim();
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return (
    '#' +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(
  rgb1: { r: number; g: number; b: number },
  rgb2: { r: number; g: number; b: number }
): number {
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function adjustForContrast(
  textRgb: { r: number; g: number; b: number },
  bgRgb: { r: number; g: number; b: number },
  targetRatio: number
): { r: number; g: number; b: number } {
  let ratio = getContrastRatio(textRgb, bgRgb);
  if (ratio >= targetRatio) return textRgb;

  const bgLuminance = getRelativeLuminance(bgRgb);
  const shouldLighten = bgLuminance < 0.5;
  let adjusted = { ...textRgb };

  for (let i = 0; i < 20; i++) {
    if (shouldLighten) {
      adjusted.r = Math.min(255, adjusted.r + 15);
      adjusted.g = Math.min(255, adjusted.g + 15);
      adjusted.b = Math.min(255, adjusted.b + 15);
    } else {
      adjusted.r = Math.max(0, adjusted.r - 15);
      adjusted.g = Math.max(0, adjusted.g - 15);
      adjusted.b = Math.max(0, adjusted.b - 15);
    }

    ratio = getContrastRatio(adjusted, bgRgb);
    if (ratio >= targetRatio) break;
  }

  return adjusted;
}
