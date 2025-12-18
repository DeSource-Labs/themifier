/**
 * Dynamic Theme Engine
 *
 * Watches DOM for stylesheets and applies color transformations with:
 * - Inline style attribute tracking via data-themifier-inline-* attributes
 * - Color registry for consistency
 * - Recursive DOM watching for dynamic content
 * - CORS-safe stylesheet processing
 * - Automatic theme updates with cascade clearing
 * - Loop detection to prevent browser crashes
 * - SVG analysis for logo preservation
 * - Mutation throttling for SPA performance
 */

import { parseColor, rgbToHex } from '@/utils/color';

import { globalColorRegistry } from './colorRegistry';
import { transformCSSColor, transformColor, clearColorCache } from './colorTransform';
import { processStylesheet } from './cssProcessor';
import { disposePalette } from './palette';

import type { ThemeProfile } from '@/types/theme';

// Loop detection constants
const LOOP_DETECTION_THRESHOLD = 500; // 0.5 second
const MAX_LOOP_CYCLES = 4; // Max cycles before bailout

// SVG analysis constants
const SMALL_SVG_THRESHOLD = 32; // pixels

// Loop detection storage
const elementsLastChanges = new WeakMap<Node, number>();
const elementsLoopCycles = new WeakMap<Node, number>();
const loopWarnedRecently = new WeakMap<Node, number>();

// SVG analysis storage
const svgInversionCache = new WeakSet<SVGSVGElement>();
const svgAnalysisCache = new WeakMap<SVGSVGElement, boolean>();
const svgRootSizeCache = new WeakMap<SVGSVGElement, boolean>();

/**
 * Style element type
 */
type StyleElement = HTMLStyleElement | HTMLLinkElement | SVGStyleElement;

/**
 * Configuration for inline style tracking
 * Prevents re-processing of already-transformed inline styles
 */
const INLINE_OVERRIDES = {
  // Data attribute for tracking inline transformations
  ATTR_PREFIX: 'data-themifier-inline-',

  // Tracked color properties
  TRACKED_PROPERTIES: [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderLeftColor',
    'outlineColor',
    'boxShadow',
  ],
};

/**
 * Dynamic Theme Engine class
 */
export class DynamicThemeEngine {
  private theme: ThemeProfile | null = null;
  private observers: MutationObserver[] = [];
  private managedSheets = new WeakSet<StyleElement>();
  private managedSheetCount = 0;
  private injectedStyles = new Set<HTMLStyleElement>();
  private transformedInlineElements = new WeakSet<HTMLElement>();
  private transformedElementCount = 0;
  private baseStyle: HTMLStyleElement | null = null;
  private isDestroyed = false;
  private observersStarted = false;
  private inlineObservationEnabled = false;
  private inlineObserver: MutationObserver | null = null;
  private headObserver: MutationObserver | null = null;

  /**
   * Update theme (re-process all stylesheets and inline styles)
   */
  updateTheme(theme: ThemeProfile, options?: { enableInlineObservation?: boolean }): void {
    if (this.isDestroyed) {
      return;
    }

    this.theme = theme;

    // Flush global color caches to avoid cross-theme palette reuse
    clearColorCache();

    this.inlineObservationEnabled = options?.enableInlineObservation === true;

    // Ensure observers are attached exactly once
    this.ensureObservers();
    // If observers already running, align inline observer state with latest option
    if (this.observersStarted) {
      this.watchForInlineStyles(this.inlineObservationEnabled);
    }

    // Clear color registry for old theme
    globalColorRegistry.clearTheme(theme.id);

    // Remove existing overrides
    this.injectedStyles.forEach((style) => {
      style.remove();
    });
    this.injectedStyles.clear();
    this.managedSheets = new WeakSet();
    this.managedSheetCount = 0;

    // Clear inline transformation tracking (will re-process)
    this.transformedInlineElements = new WeakSet();
    this.transformedElementCount = 0;

    // Re-inject base and process sheets
    if (this.baseStyle) {
      this.baseStyle.remove();
      this.baseStyle = null;
    }
    this.injectBaseStyles();
    this.processExistingStylesheets();

    // Reprocess inline styles with new theme
    this.reprocessAllInlineStyles();
  }

  /**
   * Ensure observers start once per engine instance
   */
  private ensureObservers(): void {
    if (this.observersStarted || this.isDestroyed) {
      return;
    }
    this.watchForInlineStyles(this.inlineObservationEnabled);
    this.observersStarted = true;
  }

  /**
   * Inject base user-agent style overrides
   */
  private injectBaseStyles(): void {
    if (!this.theme) {
      return;
    }

    const bgRgb = parseColor(this.theme.palette.background);
    const textRgb = parseColor(this.theme.palette.text);

    if (!bgRgb || !textRgb) {
      return;
    }

    const bgColor = rgbToHex(bgRgb);
    const textColor = rgbToHex(textRgb);
    const surfaceColor = rgbToHex(parseColor(this.theme.palette.surface) || bgRgb);
    const accentColor = transformCSSColor(this.theme.palette.accent, 'text', this.theme) || '#4f46e5';
    const borderColor = transformCSSColor('#4c4c4c', 'border', this.theme) || '#666';
    const successColor = transformCSSColor('#22c55e', 'text', this.theme) || '#22c55e';
    const errorColor = transformCSSColor('#ef4444', 'text', this.theme) || '#ef4444';
    const warningColor = transformCSSColor('#f59e0b', 'text', this.theme) || '#f59e0b';

    let baseCSS = `
      :root {
        --themifier-bg: ${bgColor};
        --themifier-text: ${textColor};
        --themifier-surface: ${surfaceColor};
        --themifier-accent: ${accentColor};
        --themifier-border: ${borderColor};
        --themifier-success: ${successColor};
        --themifier-error: ${errorColor};
        --themifier-warning: ${warningColor};
      }

      html {
        background: ${bgColor} !important;
        color: ${textColor} !important;
      }

      body {
        background: ${bgColor} !important;
        color: ${textColor} !important;
      }

      /* Common containers - catch white backgrounds */
      section, main, article, aside, header, footer, nav, ::before, ::after {
        background: transparent !important;
        color: ${textColor};
      }

      /* Override common white/light backgrounds */
      [style*="background: white"],
      [style*="background:white"],
      [style*="background: #fff"],
      [style*="background:#fff"],
      [style*="background: #ffffff"],
      [style*="background:#ffffff"],
      [style*="background-color: white"],
      [style*="background-color:white"],
      [style*="background-color: #fff"],
      [style*="background-color:#fff"],
      [style*="background-color: #ffffff"],
      [style*="background-color:#ffffff"] {
        background-color: ${bgColor} !important;
      }

      /* Form controls */
      input:not([type="image"]), textarea, select, button {
        background: ${transformCSSColor('#ffffff', 'background', this.theme)} !important;
        color: ${transformCSSColor('#000000', 'text', this.theme)} !important;
        border-color: ${borderColor} !important;
      }

      /* Form disabled state */
      input:disabled, textarea:disabled, select:disabled, button:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }

      /* Form focus/active states */
      input:focus, textarea:focus, select:focus, button:focus {
        outline-color: ${accentColor} !important;
        box-shadow: 0 0 0 2px ${bgColor}, 0 0 0 4px ${accentColor} !important;
      }

      /* Links */
      a {
        color: ${accentColor} !important;
        background: transparent !important;
      }

      a:visited {
        color: ${transformCSSColor('#8b5cf6', 'text', this.theme)} !important;
      }

      a:hover {
        opacity: 0.8 !important;
      }

      a:active {
        opacity: 0.6 !important;
      }

      /* Buttons */
      button, [role="button"] {
        background: ${accentColor} !important;
        color: ${bgColor} !important;
        border: 1px solid ${accentColor} !important;
        cursor: pointer !important;
      }

      button:hover, [role="button"]:hover {
        opacity: 0.9 !important;
      }

      button:active, [role="button"]:active {
        opacity: 0.7 !important;
      }

      /* Placeholder */
      ::placeholder {
        color: ${transformCSSColor('#a9a9a9', 'text', this.theme)} !important;
        opacity: 0.6 !important;
      }

      /* Selection */
      ::selection {
        background: ${accentColor} !important;
        color: ${bgColor} !important;
      }

      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: ${bgColor} !important;
      }

      ::-webkit-scrollbar-thumb {
        background: ${borderColor} !important;
        border-radius: 6px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: ${transformCSSColor('#6b7280', 'border', this.theme)} !important;
      }

      /* Firefox scrollbar */
      * {
        scrollbar-color: ${borderColor} ${bgColor} !important;
        scrollbar-width: thin !important;
      }

      /* Code blocks */
      code, pre {
        background: ${surfaceColor} !important;
        color: ${accentColor} !important;
        border: 1px solid ${borderColor} !important;
      }

      pre {
        padding: 12px !important;
        border-radius: 4px !important;
        overflow-x: auto !important;
      }

      /* Tables */
      table {
        border-collapse: collapse !important;
        border-color: ${borderColor} !important;
      }

      thead {
        background: ${surfaceColor} !important;
        color: ${textColor} !important;
      }

      tbody tr:nth-child(even) {
        background: ${surfaceColor} !important;
      }

      tbody tr:nth-child(odd) {
        background: ${bgColor} !important;
      }

      td, th {
        border-color: ${borderColor} !important;
        padding: 8px !important;
      }

      /* Modals and overlays */
      [role="dialog"], .modal, .dialog {
        background: ${bgColor} !important;
        color: ${textColor} !important;
        border-color: ${borderColor} !important;
      }

      [role="dialog"]::backdrop, .modal::backdrop {
        background-color: rgba(0, 0, 0, 0.5) !important;
      }

      /* Validation colors */
      input:valid, textarea:valid {
        border-color: ${successColor} !important;
      }

      input:invalid, textarea:invalid {
        border-color: ${errorColor} !important;
      }

      [aria-invalid="true"], .error, .is-invalid {
        color: ${errorColor} !important;
        border-color: ${errorColor} !important;
      }

      .success, .is-valid {
        color: ${successColor} !important;
        border-color: ${successColor} !important;
      }

      .warning {
        color: ${warningColor} !important;
        border-color: ${warningColor} !important;
      }

      /* Badges and labels */
      [role="img"], .badge, .label, .tag {
        background: ${surfaceColor} !important;
        color: ${textColor} !important;
        border-color: ${borderColor} !important;
      }
    `;

    if (this.theme.reducedMotion) {
      baseCSS += `
        /* Reduce motion for accessibility */
        *, *::before, *::after {
          animation-duration: 0ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0ms !important;
          scroll-behavior: auto !important;
        }
      `;
    }

    this.baseStyle = document.createElement('style');
    this.baseStyle.className = 'themifier-base-dynamic';
    this.baseStyle.textContent = baseCSS;
    document.documentElement.prepend(this.baseStyle);
  }

  /**
   * Process all existing stylesheets
   */
  private processExistingStylesheets(): void {
    if (!this.theme) {
      return;
    }

    // Find all style and link elements
    const sheets = document.querySelectorAll<StyleElement>('style, link[rel*="stylesheet"]');

    for (const element of sheets) {
      if (this.managedSheets.has(element)) {
        continue;
      }

      if (
        element.classList.contains('themifier-base-dynamic') ||
        element.classList.contains('themifier-override-dynamic')
      ) {
        continue;
      }

      if (element instanceof HTMLLinkElement) {
        // Wait for link to load
        if (element.sheet) {
          this.processSheet(element);
        } else {
          element.addEventListener('load', () => this.processSheet(element), { once: true });
        }
      } else if (element instanceof HTMLStyleElement || element instanceof SVGStyleElement) {
        this.processSheet(element);
      }
    }
  }

  /**
   * Process a single stylesheet element
   */
  private processSheet(element: StyleElement): void {
    if (!this.theme || this.managedSheets.has(element) || this.isDestroyed) {
      return;
    }

    this.managedSheets.add(element);
    this.managedSheetCount++;

    try {
      const { sheet } = element as HTMLStyleElement | HTMLLinkElement;

      if (!sheet) {
        return;
      }

      const modifiedCSS = processStylesheet(sheet, this.theme);

      if (modifiedCSS) {
        const overrideStyle = document.createElement('style');
        overrideStyle.className = 'themifier-override-dynamic';
        overrideStyle.textContent = modifiedCSS;

        // Insert after source element
        element.parentNode?.insertBefore(overrideStyle, element.nextSibling);
        this.injectedStyles.add(overrideStyle);
      }
    } catch {
      // CORS or other access error - skip this stylesheet
    }
  }

  /**
   * Watch for inline style attribute changes with deduplication
   *
   * Uses data-themifier-inline-* attributes to prevent
   * double-transformation when DOM updates trigger multiple mutations
   */
  private watchForInlineStyles(enableInlineObservation: boolean): void {
    // Two-scope strategy: head childList for stylesheet additions, full subtree for inline style attrs
    let scheduled = false;
    const inlineQueue: Set<HTMLElement> = new Set();
    const sheetQueue: Set<StyleElement> = new Set();
    const MAX_INLINE_PER_FRAME = 200;

    const flushQueues = () => {
      // Process all queued stylesheets immediately
      for (const el of sheetQueue) {
        this.processSheet(el);
      }
      sheetQueue.clear();

      // Process inline styles in chunks using RAF to avoid blocking
      // This prevents jank on pages with thousands of inline styles
      let processed = 0;
      const processChunk = () => {
        if (this.isDestroyed || !this.theme) return;
        const iterator = inlineQueue.values();
        // Process up to MAX_INLINE_PER_FRAME elements per animation frame
        while (processed < MAX_INLINE_PER_FRAME) {
          const next = iterator.next();
          if (next.done) break;
          const el = next.value as HTMLElement;
          inlineQueue.delete(el);
          // Skip if already transformed to avoid double-processing
          if (!this.transformedInlineElements.has(el)) {
            this.processInlineStyle(el);
          }
          processed++;
        }
        // If more elements remain, schedule another RAF callback
        if (inlineQueue.size > 0) {
          processed = 0;
          requestAnimationFrame(processChunk);
        }
      };
      // Kick off the chunked processing
      requestAnimationFrame(processChunk);
    };

    const scheduleFlush = () => {
      if (scheduled) return;
      scheduled = true;
      // Debounce flushes to the next RAF to batch multiple mutations
      requestAnimationFrame(() => {
        scheduled = false;
        flushQueues();
      });
    };

    const handleAddedNode = (node: Node) => {
      // Queue stylesheet processing
      if (node instanceof HTMLStyleElement || node instanceof SVGStyleElement) {
        // Skip our own injected styles to avoid reprocessing
        if (
          !node.classList.contains('themifier-base-dynamic') &&
          !node.classList.contains('themifier-override-dynamic')
        ) {
          sheetQueue.add(node);
        }
      } else if (node instanceof HTMLLinkElement && node.rel.includes('stylesheet')) {
        // External stylesheet - queue for processing when loaded
        if (node.sheet) {
          sheetQueue.add(node);
        } else {
          // Not yet loaded - listen for load event
          node.addEventListener('load', () => this.processSheet(node), { once: true });
        }
      } else if (node instanceof HTMLElement) {
        // Queue inline styles on element and all descendants
        if (node.hasAttribute('style')) {
          inlineQueue.add(node);
        }
        const descendants = node.querySelectorAll('[style]');
        for (const d of Array.from(descendants)) {
          inlineQueue.add(d as HTMLElement);
        }
      }
    };

    // Observe head for stylesheet/link additions only
    if (!this.headObserver) {
      this.headObserver = new MutationObserver((mutations) => {
        if (this.isDestroyed || !this.theme) return;
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              handleAddedNode(node);
            }
          }
        }
        scheduleFlush();
      });

      this.headObserver.observe(document.head || document.documentElement, {
        childList: true,
        subtree: false,
      });
      this.observers.push(this.headObserver);
    }

    // Inline observer is optional per site (controlled by advancedDynamic setting)
    if (!enableInlineObservation) {
      if (this.inlineObserver) {
        this.inlineObserver.disconnect();
        this.inlineObserver = null;
      }
      return;
    }

    if (this.inlineObserver) {
      return;
    }

    const inlineObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed || !this.theme) return;
      for (const mutation of mutations) {
        // New elements added to page - queue for inline style processing
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            handleAddedNode(node);
          }
        }
        // Inline style attribute changed - reprocess
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          inlineQueue.add(mutation.target as HTMLElement);
        }
      }
      scheduleFlush();
    });

    inlineObserver.observe(document.documentElement, {
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    });
    this.inlineObserver = inlineObserver;
    this.observers.push(inlineObserver);
  }

  /**
   * Process inline style attribute on element with tracking
   *
   * Marks element with data-themifier-inline-<property> attributes
   * to prevent re-processing on subsequent DOM mutations
   */
  private processInlineStyle(element: HTMLElement): void {
    if (!this.theme) {
      return;
    }

    // Loop detection
    if (shouldSkipLoopElement(element)) {
      return;
    }

    // SVG-specific handling
    if (element instanceof SVGElement) {
      const svg = getSVGElementRoot(element);
      if (svg && shouldAnalyzeSVGAsImage(svg)) {
        // For logo SVGs, apply inversion attribute instead of inline transform
        if (!svgInversionCache.has(svg)) {
          svgInversionCache.add(svg);
          if (this.theme.id === 'dark' || this.theme.id === 'night-warm') {
            // Check if SVG is dark/light transparent to determine inversion
            if (isSmallSVG(svg)) {
              svg.setAttribute('data-themifier-inline-invert', '');
            }
          }
        }
        return;
      }
    }

    const { style } = element;

    // Check common color properties
    const properties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ];

    let hasChanges = false;

    for (const prop of properties) {
      const value = style.getPropertyValue(prop);
      if (value) {
        const colorType = prop.includes('background') ? 'background' : prop.includes('border') ? 'border' : 'text';

        // Use colorTransform with registry if available
        const transformed =
          this.transformColorWithRegistry(value, colorType) || transformCSSColor(value, colorType, this.theme);

        if (transformed && transformed !== value) {
          element.style.setProperty(prop, transformed, 'important');
          hasChanges = true;
        }

        // Mark as transformed
        element.setAttribute(`${INLINE_OVERRIDES.ATTR_PREFIX}${prop}`, 'true');
      }
    }

    if (hasChanges) {
      this.transformedInlineElements.add(element);
      this.transformedElementCount++;
    }
  }

  /**
   * Transform color using registry lookup + fallback
   * Registry provides consistency for previously transformed colors
   */
  private transformColorWithRegistry(colorValue: string, colorType: 'background' | 'text' | 'border'): string | null {
    if (!this.theme) {
      return null;
    }

    const rgb = parseColor(colorValue);
    if (!rgb) {
      return null;
    }

    // Check registry first
    const registered = globalColorRegistry.getTransformed(rgb, colorType, this.theme.id);
    if (registered) {
      return registered;
    }

    // Transform and register
    try {
      const transformed = transformColor(rgb, colorType, this.theme);
      globalColorRegistry.register({
        originalRGB: rgb,
        originalHex: colorValue,
        transformedHex: transformed,
        colorType,
        themeId: this.theme.id,
      });
      return transformed;
    } catch {
      return null;
    }
  }

  /**
   * Reprocess all inline styles in the document
   * Called when theme changes to update all inline colors
   */
  private reprocessAllInlineStyles(): void {
    const elements = document.querySelectorAll('[style]');
    for (const element of elements) {
      this.transformedInlineElements.delete(element as HTMLElement);
      this.processInlineStyle(element as HTMLElement);
    }
  }

  /**
   * Clear applied theme artifacts without destroying observers.
   * Lets callers stop applying while keeping the engine reusable
   */
  clear(): void {
    if (this.isDestroyed) {
      return;
    }

    // Disable inline observation until explicitly re-enabled
    this.inlineObservationEnabled = false;
    if (this.inlineObserver) {
      this.inlineObserver.disconnect();
      this.observers = this.observers.filter((o) => o !== this.inlineObserver);
      this.inlineObserver = null;
    }

    if (this.baseStyle) {
      this.baseStyle.remove();
      this.baseStyle = null;
    }

    for (const style of this.injectedStyles) {
      style.remove();
    }
    this.injectedStyles.clear();

    if (this.theme) {
      globalColorRegistry.clearTheme(this.theme.id);
    }

    this.managedSheets = new WeakSet();
    this.managedSheetCount = 0;
    this.transformedInlineElements = new WeakSet();
    this.transformedElementCount = 0;
    this.theme = null;
  }

  /**
   * Clean up and destroy the engine
   */
  destroy(): void {
    this.clear();
    this.isDestroyed = true;

    // Disconnect all observers
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    globalColorRegistry.clear();
    disposePalette();
  }
}

/**
 * Loop Detection.
 * Prevents browser crashes on reactive frameworks (React, Vue, etc.)
 */
function shouldSkipLoopElement(element: Node): boolean {
  if (!elementsLastChanges.has(element)) {
    elementsLastChanges.set(element, Date.now());
    return false;
  }

  const lastChange = elementsLastChanges.get(element)!;
  const now = Date.now();

  if (now - lastChange < LOOP_DETECTION_THRESHOLD) {
    const cycles = elementsLoopCycles.get(element) ?? 0;
    elementsLoopCycles.set(element, cycles + 1);

    if (cycles >= MAX_LOOP_CYCLES) {
      // Rate-limit warnings to once per 5 seconds per element
      const lastWarn = (loopWarnedRecently as any)?.get?.(element) ?? 0;
      if (typeof lastWarn !== 'number' || now - lastWarn > 5000) {
        try {
          loopWarnedRecently.set(element, now);
        } catch (e) {
          // ignore
        }
        // Loop detected - suppress further processing to avoid browser crash
      }
      return true; // BAIL OUT
    }
  } else {
    // Reset cycle counter if outside threshold
    elementsLoopCycles.set(element, 0);
  }

  elementsLastChanges.set(element, now);
  return false;
}

/**
 * SVG Analysis.
 * Determines if SVG should be analyzed as an image (for logos)
 */
function shouldAnalyzeSVGAsImage(svg: SVGSVGElement): boolean {
  if (svgAnalysisCache.has(svg)) {
    return svgAnalysisCache.get(svg)!;
  }

  const shouldAnalyze = Boolean(
    svg &&
    (svg.getAttribute('class')?.includes('logo') ||
      svg.parentElement?.getAttribute('class')?.includes('logo') ||
      svg.querySelector('[class*="logo"]'))
  );

  svgAnalysisCache.set(svg, shouldAnalyze);
  return shouldAnalyze;
}

/**
 * Small SVG Detection.
 * Small SVGs (< 32x32px) are treated as icons
 */
function isSmallSVG(svg: SVGSVGElement): boolean {
  if (svgRootSizeCache.has(svg)) {
    return svgRootSizeCache.get(svg)!;
  }

  const bounds = svg.getBoundingClientRect();
  const isSmall = bounds.width * bounds.height <= SMALL_SVG_THRESHOLD * SMALL_SVG_THRESHOLD;

  svgRootSizeCache.set(svg, isSmall);
  return isSmall;
}

/**
 * Get SVG Root.
 * Traverse SVG tree to find root element
 */
function getSVGElementRoot(element: SVGElement): SVGSVGElement | null {
  if (!element) {
    return null;
  }

  if (element instanceof SVGSVGElement) {
    return element;
  }

  const parent = element.parentElement;
  if (parent instanceof SVGElement) {
    return getSVGElementRoot(parent);
  }

  return null;
}

/**
 * Global engine instance (singleton per content script)
 */
let engineInstance: DynamicThemeEngine | null = null;

/**
 * Get or create the global engine instance
 */
export function getEngineInstance(): DynamicThemeEngine {
  if (!engineInstance) {
    engineInstance = new DynamicThemeEngine();
  }
  return engineInstance;
}
