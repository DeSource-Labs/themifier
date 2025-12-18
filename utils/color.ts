/**
 * Color utility functions for RGB<->HSL conversion and color parsing
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

// Color parsing caches for performance
const rgbaParseCache = new Map<string, RGBA>();
const hslaParseCache = new Map<string, HSLA>();

/**
 * Convert RGB to HSL color space
 * Based on: https://en.wikipedia.org/wiki/HSL_and_HSV
 */
export function rgbToHSL({ r: r255, g: g255, b: b255, a = 1 }: RGBA): HSLA {
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = max - min;

  const l = (max + min) / 2;

  if (c === 0) {
    return { h: 0, s: 0, l, a };
  }

  let h = max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
  h *= 60;
  if (h < 0) {
    h += 360;
  }

  const s = c / (1 - Math.abs(2 * l - 1));

  return { h, s, l, a };
}

/**
 * Convert HSL to RGB color space
 * Based on: https://en.wikipedia.org/wiki/HSL_and_HSV
 */
export function hslToRGB({ h, s, l, a = 1 }: HSLA): RGBA {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray, a };
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] = (
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  ).map((n) => Math.round((n + m) * 255));

  return { r, g, b, a };
}

/**
 * Parse hex color string to RGBA
 */
export function parseHex(hex: string): RGBA | null {
  const h = hex.startsWith('#') ? hex.substring(1) : hex;

  switch (h.length) {
    case 3:
    case 4: {
      const [r, g, b] = [0, 1, 2].map((i) => parseInt(`${h[i]}${h[i]}`, 16));
      const a = h.length === 3 ? 1 : parseInt(`${h[3]}${h[3]}`, 16) / 255;
      return { r, g, b, a };
    }
    case 6:
    case 8: {
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16));
      const a = h.length === 6 ? 1 : parseInt(h.substring(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  }
  return null;
}

/**
 * Parse rgb/rgba color string to RGBA
 */
export function parseRGB(rgb: string): RGBA | null {
  const match = rgb.match(/rgba?\s*\(\s*([^)]+)\)/);
  if (!match) return null;

  const parts = match[1].split(/\s*[,\s]\s*/).map((p) => p.trim());
  if (parts.length < 3) return null;

  const [r, g, b] = parts.map((p, i) => {
    if (p.endsWith('%')) {
      return (parseFloat(p) / 100) * 255;
    }
    return parseFloat(p);
  });

  const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;

  return { r, g, b, a };
}

/**
 * Parse hsl/hsla color string to RGBA
 */
export function parseHSL(hsl: string): RGBA | null {
  const match = hsl.match(/hsla?\s*\(\s*([^)]+)\)/);
  if (!match) return null;

  const parts = match[1].split(/\s*[,\s]\s*/).map((p) => p.trim());
  if (parts.length < 3) return null;

  let h = parseFloat(parts[0]);
  if (parts[0].includes('deg')) {
    h = parseFloat(parts[0]);
  } else if (parts[0].includes('rad')) {
    h = (parseFloat(parts[0]) * 180) / Math.PI;
  } else if (parts[0].includes('turn')) {
    h = parseFloat(parts[0]) * 360;
  }

  const s = parseFloat(parts[1]) / (parts[1].includes('%') ? 100 : 1);
  const l = parseFloat(parts[2]) / (parts[2].includes('%') ? 100 : 1);
  const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;

  if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) return null;

  return hslToRGB({ h, s, l, a });
}

/**
 * Known CSS color names
 */
const knownColors: Record<string, number> = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgrey: 0xa9a9a9,
  darkgreen: 0x006400,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  grey: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgrey: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32,
};

/**
 * Parse named color to RGBA
 */
function parseNamedColor(name: string): RGBA | null {
  const n = knownColors[name.toLowerCase()];
  if (n === undefined) return null;

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: (n >> 0) & 255,
    a: 1,
  };
}

/**
 * Parse any color format to RGBA with caching
 */
export function parseColor(color: string): RGBA | null {
  const normalized = color.trim().toLowerCase();

  // Check cache
  if (rgbaParseCache.has(normalized)) {
    return rgbaParseCache.get(normalized)!;
  }

  // Skip unparseable values
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

  let result: RGBA | null = null;

  if (normalized === 'transparent') {
    result = { r: 0, g: 0, b: 0, a: 0 };
  } else if (normalized.startsWith('#')) {
    result = parseHex(normalized);
  } else if (normalized.startsWith('rgb')) {
    result = parseRGB(normalized);
  } else if (normalized.startsWith('hsl')) {
    result = parseHSL(normalized);
  } else {
    result = parseNamedColor(normalized);
  }

  if (result) {
    rgbaParseCache.set(normalized, result);
  }

  return result;
}

/**
 * Parse color to HSL with caching
 */
export function parseToHSL(color: string): HSLA | null {
  if (hslaParseCache.has(color)) {
    return hslaParseCache.get(color)!;
  }

  const rgb = parseColor(color);
  if (!rgb) return null;

  const hsl = rgbToHSL(rgb);
  hslaParseCache.set(color, hsl);
  return hsl;
}

/**
 * Convert RGBA to hex string
 */
export function rgbToHex({ r, g, b, a }: RGBA): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  if (a < 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a * 255)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGBA to rgb/rgba string
 */
export function rgbToString({ r, g, b, a }: RGBA): string {
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);

  if (a < 1) {
    return `rgba(${rInt}, ${gInt}, ${bInt}, ${a.toFixed(2)})`;
  }
  return `rgb(${rInt}, ${gInt}, ${bInt})`;
}

/**
 * Convert HSLA to hsl/hsla string
 */
export function hslToString({ h, s, l, a }: HSLA): string {
  const hInt = Math.round(h);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  if (a < 1) {
    return `hsla(${hInt}, ${sPercent}%, ${lPercent}%, ${a.toFixed(2)})`;
  }
  return `hsl(${hInt}, ${sPercent}%, ${lPercent}%)`;
}

/**
 * Linear scale utility
 */

export function scale(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return clamp(
    outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin),
    Math.min(outMin, outMax),
    Math.max(outMin, outMax)
  );
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clear color caches (useful when memory optimization needed)
 */
export function clearColorCache(): void {
  rgbaParseCache.clear();
  hslaParseCache.clear();
}
