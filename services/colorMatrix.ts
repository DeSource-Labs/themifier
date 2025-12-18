/**
 * Color Matrix Filter Engine
 *
 * Applies mathematical transformation matrices to RGB colors to compensate for:
 * - Display gamma curves
 * - Perceptual color adjustments
 * - Contrast and brightness
 *
 * This is critical for achieving perceptually correct dark mode colors.
 * Without this, colors transformed via HSL appear oversaturated or incorrect.
 */

import type { ThemeProfile } from '@/types/theme';
import type { RGBA } from '@/utils/color';

/**
 * 3x3 Color Matrix for RGB channel transformations
 * Applied as: [R', G', B'] = matrix × [R, G, B]
 */
export interface ColorMatrix {
  // Matrix represented as flat array for performance
  // [r11, r12, r13, r21, r22, r23, r31, r32, r33]
  values: number[];
  // Metadata for debugging
  type: 'gamma' | 'contrast' | 'brightness' | 'combined';
  description: string;
}

/**
 * Identity matrix (no transformation)
 */
export const IDENTITY_MATRIX: ColorMatrix = {
  values: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  type: 'combined',
  description: 'Identity (no transformation)',
};

/**
 * Apply color matrix transformation to RGB channels
 *
 * @param rgb Input RGB values (0-255)
 * @param matrix Transformation matrix
 * @returns Transformed RGB values (0-255, clamped)
 *
 * @example
 * const rgb = {r: 128, g: 128, b: 128}
 * const transformed = applyColorMatrix(rgb, gammaMatrix)
 */
export function applyColorMatrix(rgb: RGBA, matrix: ColorMatrix): RGBA {
  const { r: r255, g: g255, b: b255, a = 1 } = rgb;

  // Normalize to 0-1 range
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;

  const m = matrix.values;

  // Matrix multiplication: [R', G', B'] = M × [R, G, B]
  // [r11 r12 r13] [r]
  // [r21 r22 r23] [g]
  // [r31 r32 r33] [b]
  const rNew = m[0] * r + m[1] * g + m[2] * b;
  const gNew = m[3] * r + m[4] * g + m[5] * b;
  const bNew = m[6] * r + m[7] * g + m[8] * b;
  // Clamp to 0-1 and convert back to 0-255
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  return {
    r: Math.round(clamp(rNew) * 255),
    g: Math.round(clamp(gNew) * 255),
    b: Math.round(clamp(bNew) * 255),
    a,
  };
}

/**
 * TODO: NOT USED
 *
 * Apply color matrix to a single channel value
 * Used when only transforming one channel
 */
export function applyMatrixToValue(
  value: number, // 0-255
  matrix: ColorMatrix,
  channel: 'r' | 'g' | 'b'
): number {
  const channels = { r: [0, 1, 2], g: [3, 4, 5], b: [6, 7, 8] };
  const [i, j, k] = channels[channel];
  const m = matrix.values;
  const normalized = value / 255;

  const result = m[i] * normalized + m[j] * normalized + m[k] * normalized;
  return Math.round(Math.max(0, Math.min(1, result)) * 255);
}

/**
 * Create a gamma correction matrix
 *
 * Gamma curve: output = input ^ (1/gamma)
 * Higher gamma (2.2) = brighter display typical (sRGB standard)
 * Lower gamma (1.8) = darker display
 *
 * @param gamma Gamma exponent (typically 2.2 for sRGB)
 * @returns Color matrix with gamma correction
 *
 * @example
 * const gammaMatrix = createGammaMatrix(2.2)
 * // Makes colors slightly brighter to compensate for gamma
 */
export function createGammaMatrix(gamma: number = 2.2): ColorMatrix {
  const exponent = 1 / gamma;

  // Apply gamma to each diagonal element
  // Off-diagonal elements remain 0 (no cross-channel mixing)
  const v = Math.pow(2, exponent - 1); // Correction factor

  return {
    values: [v, 0, 0, 0, v, 0, 0, 0, v],
    type: 'gamma',
    description: `Gamma ${gamma.toFixed(2)} correction`,
  };
}

/**
 * Create contrast adjustment matrix
 *
 * Contrast = (color - 0.5) * factor + 0.5
 * Higher contrast value = more extreme (darker darks, lighter lights)
 *
 * @param contrast Contrast multiplier (1 = neutral, >1 = more contrast)
 * @returns Color matrix
 *
 * @example
 * const contrastMatrix = createContrastMatrix(1.2) // +20% contrast
 */
export function createContrastMatrix(contrast: number = 1.0): ColorMatrix {
  // For contrast, we need: output = (input - 0.5) * contrast + 0.5
  // Which in matrix form is more complex, so we use a simplified version

  if (contrast === 1) {
    return IDENTITY_MATRIX;
  }

  // Diagonal elements amplify the color
  // Offset adjusts the midpoint
  const offset = (1 - contrast) / 2;

  return {
    values: [contrast, 0, 0, 0, contrast, 0, 0, 0, contrast],
    type: 'contrast',
    description: `Contrast ${(contrast * 100).toFixed(0)}%`,
  };
}

/**
 * Create brightness adjustment matrix
 *
 * Simple scaling: output = input * brightness
 * Higher brightness = lighter colors
 *
 * @param brightness Brightness multiplier (1 = neutral, >1 = brighter)
 * @returns Color matrix
 *
 * @example
 * const brightnessMatrix = createBrightnessMatrix(1.1) // +10% brightness
 */
export function createBrightnessMatrix(brightness: number = 1.0): ColorMatrix {
  if (brightness === 1) {
    return IDENTITY_MATRIX;
  }

  return {
    values: [brightness, 0, 0, 0, brightness, 0, 0, 0, brightness],
    type: 'brightness',
    description: `Brightness ${(brightness * 100).toFixed(0)}%`,
  };
}

/**
 * Compose two color matrices together
 *
 * If you apply matrix A then matrix B:
 * final = B × A (order matters!)
 *
 * @param matrixA First transformation
 * @param matrixB Second transformation
 * @returns Combined matrix
 *
 * @example
 * const gamma = createGammaMatrix(2.2)
 * const contrast = createContrastMatrix(1.1)
 * const combined = composeMatrices(gamma, contrast)
 */
export function composeMatrices(matrixA: ColorMatrix, matrixB: ColorMatrix): ColorMatrix {
  const a = matrixA.values;
  const b = matrixB.values;

  // 3x3 matrix multiplication
  const result = new Array(9);

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      result[i * 3 + j] = a[i * 3 + 0] * b[0 * 3 + j] + a[i * 3 + 1] * b[1 * 3 + j] + a[i * 3 + 2] * b[2 * 3 + j];
    }
  }

  return {
    values: result,
    type: 'combined',
    description: `${matrixA.description} + ${matrixB.description}`,
  };
}

/**
 * Create filter matrix for a theme
 *
 * This applies perceptual adjustments based on the theme's
 * brightness, contrast, and saturation settings.
 *
 * The matrix accounts for how humans perceive color in different
 * lighting conditions.
 *
 * @param theme Theme profile with filters
 * @param isDarkMode Whether this is dark or light mode
 * @returns Combined color matrix
 *
 * @example
 * const darkTheme = { palette: {...}, filters: {brightness: 1.1, contrast: 1.05} }
 * const matrix = createFilterMatrix(darkTheme, true)
 * const correctedRGB = applyColorMatrix(originalRGB, matrix)
 */
export function createFilterMatrix(theme: ThemeProfile, isDarkMode: boolean = true): ColorMatrix {
  const filters = theme.filters || {};

  // Start with identity
  let matrix = IDENTITY_MATRIX;

  // Apply brightness
  if (filters.brightness && filters.brightness !== 1) {
    const brightnessMatrix = createBrightnessMatrix(filters.brightness);
    matrix = composeMatrices(matrix, brightnessMatrix);
  }

  // Apply contrast
  if (filters.contrast && filters.contrast !== 1) {
    const contrastMatrix = createContrastMatrix(filters.contrast);
    matrix = composeMatrices(matrix, contrastMatrix);
  }

  // Apply gamma correction for dark mode
  // In dark mode, we want to brighten mid-tones slightly
  if (isDarkMode) {
    const gammaMatrix = createGammaMatrix(2.0); // Slightly darker gamma for dark mode
    matrix = composeMatrices(matrix, gammaMatrix);
  } else {
    const gammaMatrix = createGammaMatrix(2.2); // sRGB standard
    matrix = composeMatrices(matrix, gammaMatrix);
  }

  return matrix;
}

/**
 *
 * TODO: NOT USED
 *
 * Saturation adjustment via matrix
 *
 * This is a simplified saturation adjustment.
 * True saturation adjustment in RGB space is complex.
 *
 * @param saturation Saturation factor (1 = unchanged, <1 = desaturated, >1 = saturated)
 * @returns Color matrix
 *
 * Note: This uses luma-preserving method
 * Red weight: 0.299, Green: 0.587, Blue: 0.114
 */
export function createSaturationMatrix(saturation: number = 1.0): ColorMatrix {
  if (saturation === 1) {
    return IDENTITY_MATRIX;
  }

  // Luma coefficients (standard for desaturation)
  const lR = 0.299;
  const lG = 0.587;
  const lB = 0.114;

  // Apply saturation formula
  const s = saturation;

  return {
    values: [
      lR * (1 - s) + s,
      lG * (1 - s),
      lB * (1 - s),
      lR * (1 - s),
      lG * (1 - s) + s,
      lB * (1 - s),
      lR * (1 - s),
      lG * (1 - s),
      lB * (1 - s) + s,
    ],
    type: 'combined',
    description: `Saturation ${(saturation * 100).toFixed(0)}%`,
  };
}

/**
 * Matrix caching for performance
 * Pre-compute matrices once per theme to avoid repeated calculations
 */
const matrixCache = new Map<string, ColorMatrix>();

/**
 * Get or create cached filter matrix
 *
 * @param theme Theme profile
 * @param isDarkMode Mode indicator
 * @returns Cached color matrix
 */
export function getCachedFilterMatrix(theme: ThemeProfile, isDarkMode: boolean): ColorMatrix {
  const key = `${theme.id}-${isDarkMode}`;

  if (matrixCache.has(key)) {
    return matrixCache.get(key)!;
  }

  const matrix = createFilterMatrix(theme, isDarkMode);
  matrixCache.set(key, matrix);

  return matrix;
}

/**
 * Clear matrix cache (call on theme change)
 */
export function clearMatrixCache(): void {
  matrixCache.clear();
}

/**
 * Debug: Print matrix in readable format
 */
export function printMatrix(matrix: ColorMatrix): string {
  const m = matrix.values;
  return `
Matrix: ${matrix.description}
┌           ┐
│ ${m[0].toFixed(3)} ${m[1].toFixed(3)} ${m[2].toFixed(3)} │
│ ${m[3].toFixed(3)} ${m[4].toFixed(3)} ${m[5].toFixed(3)} │
│ ${m[6].toFixed(3)} ${m[7].toFixed(3)} ${m[8].toFixed(3)} │
└           ┘
  `.trim();
}
