/**
 * Color Registry System
 *
 * Maintains a theme-wide registry of transformed colors to ensure consistency
 * across the entire DOM. Once a color is transformed, subsequent uses of the
 * original color are looked up from the registry rather than recalculated.
 *
 * This prevents:
 * - Inconsistent transformations due to rounding/caching differences
 * - Recalculation overhead for frequently-used colors (white, black, etc.)
 * - Floating-point precision issues in repeated transformations
 *
 * Architecture:
 * - ColorRegistry: Global singleton or per-theme instance
 * - RegisteredColor: Tracks original→transformed mapping with metadata
 * - Automatic cache invalidation on theme change
 */

import type { RGBA } from '@/utils/color';

/**
 * Registered color entry with transformation metadata
 */
export interface RegisteredColor {
  /** Original color in hex format */
  originalHex: string;
  /** Original color as RGB object */
  originalRGB: RGBA;
  /** Transformed color in hex format */
  transformedHex: string;
  /** Which color type this was transformed as */
  colorType: 'background' | 'text' | 'border';
  /** Theme that this color was registered with */
  themeId: string;
  /** Timestamp for LRU eviction if cache grows too large */
  timestamp: number;
  /** Number of times this color was used */
  usageCount: number;
}

/**
 * Color Registry with flexible query methods
 *
 * Usage:
 * ```ts
 * const registry = new ColorRegistry()
 * registry.register(originalRGB, transformedHex, 'text', theme.id)
 * const transformed = registry.getTransformed(originalRGB, 'text', theme.id)
 * ```
 */
export class ColorRegistry {
  /** Map: "R,G,B,A" → RegisteredColor */
  private registry = new Map<string, RegisteredColor>();

  /** Map: theme.id → Set of registered RGB keys (for fast theme-based clearing) */
  private themeRegistry = new Map<string, Set<string>>();

  /** Maximum colors to store in registry */
  private readonly maxSize: number;

  /** Statistics for debugging and monitoring */
  private stats = {
    hits: 0,
    misses: 0,
    registrations: 0,
    evictions: 0,
  };

  /**
   * Create a new color registry
   * @param maxSize Maximum colors to store (default 1000). Older entries evicted when exceeded.
   */
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from RGBA object
   * @internal
   */
  private getKey(rgb: RGBA): string {
    return `${rgb.r},${rgb.g},${rgb.b},${rgb.a}`;
  }

  /**
   * Register a color transformation
   * @param params Color registration parameters
   * @param params.originalRGB Original color as RGB
   * @param params.originalHex Original color as hex (e.g., "#ff0000")
   * @param params.transformedHex Transformed color as hex
   * @param params.colorType Which type of color this is (affects transformation)
   * @param params.themeId Which theme this was transformed for
   */
  public register(params: {
    originalRGB: RGBA;
    originalHex: string;
    transformedHex: string;
    colorType: 'background' | 'text' | 'border';
    themeId: string;
  }): void {
    const { originalRGB, originalHex, transformedHex, colorType, themeId } = params;
    const key = this.getKey(originalRGB);

    // Check if registry is at capacity
    if (this.registry.size >= this.maxSize && !this.registry.has(key)) {
      this.evictLRU();
    }

    // Register the color
    this.registry.set(key, {
      originalHex,
      originalRGB,
      transformedHex,
      colorType,
      themeId,
      timestamp: Date.now(),
      usageCount: this.registry.has(key) ? this.registry.get(key)!.usageCount + 1 : 1,
    });

    // Track in theme registry for fast clearing
    if (!this.themeRegistry.has(themeId)) {
      this.themeRegistry.set(themeId, new Set());
    }
    this.themeRegistry.get(themeId)!.add(key);

    this.stats.registrations++;
  }

  /**
   * Look up a previously registered transformation
   * @param originalRGB Original color as RGB
   * @param colorType Color type to match
   * @param themeId Theme to match
   * @returns Transformed hex color, or null if not registered
   */
  public getTransformed(
    originalRGB: RGBA,
    colorType: 'background' | 'text' | 'border',
    themeId: string
  ): string | null {
    const key = this.getKey(originalRGB);
    const registered = this.registry.get(key);

    if (!registered) {
      this.stats.misses++;
      return null;
    }

    // Verify this is the same color type and theme
    if (registered.colorType !== colorType || registered.themeId !== themeId) {
      // Same RGB but different context - not a match
      this.stats.misses++;
      return null;
    }

    // Update timestamp and usage for LRU
    registered.timestamp = Date.now();
    registered.usageCount++;

    this.stats.hits++;
    return registered.transformedHex;
  }

  /**
   * TODO: NOT USED
   *
   * Batch register multiple color transformations
   * More efficient than individual register() calls
   * @param colors Array of color registration parameters
   */
  public registerBatch(
    colors: Array<{
      originalRGB: RGBA;
      originalHex: string;
      transformedHex: string;
      colorType: 'background' | 'text' | 'border';
      themeId: string;
    }>
  ): void {
    for (const color of colors) {
      this.register(color);
    }
  }

  /**
   * Clear all registrations for a specific theme
   * Call this when theme changes
   * @param themeId Theme to clear
   */
  public clearTheme(themeId: string): void {
    const keys = this.themeRegistry.get(themeId);
    if (!keys) return;

    for (const key of keys) {
      this.registry.delete(key);
    }
    this.themeRegistry.delete(themeId);
  }

  /**
   * Clear all registrations and reset statistics
   */
  public clear(): void {
    this.registry.clear();
    this.themeRegistry.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      registrations: 0,
      evictions: 0,
    };
  }

  /**
   * Get a registered color entry with full metadata
   *
   * **Useful for debugging**
   *
   * @param originalRGB Original color
   * @returns RegisteredColor if found, null otherwise
   */
  public getEntry(originalRGB: RGBA): RegisteredColor | null {
    const key = this.getKey(originalRGB);
    return this.registry.get(key) || null;
  }

  /**
   * Evict least-recently-used entry
   * Called when registry exceeds maxSize
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.registry.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.registry.get(oldestKey)!;
      this.registry.delete(oldestKey);

      // Also remove from theme registry
      const keys = this.themeRegistry.get(entry.themeId);
      if (keys) {
        keys.delete(oldestKey);
      }

      this.stats.evictions++;
    }
  }

  /**
   * Get registry statistics for monitoring and debugging
   * @returns Object with hit/miss counts and eviction metrics
   */
  public getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    registrations: number;
    evictions: number;
    currentSize: number;
    maxSize: number;
  } {
    const totalLookups = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: totalLookups > 0 ? (this.stats.hits / totalLookups) * 100 : 0,
      currentSize: this.registry.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Export registry as JSON for persistence
   * Useful for development/debugging
   */
  public toJSON(): Record<string, RegisteredColor> {
    const result: Record<string, RegisteredColor> = {};
    for (const [key, entry] of this.registry.entries()) {
      result[key] = entry;
    }
    return result;
  }
}

/**
 * Global color registry instance
 * Shared across the entire application for maximum efficiency
 *
 * Export the singleton so all modules can access the same registry
 */
export const globalColorRegistry = new ColorRegistry(1000);
