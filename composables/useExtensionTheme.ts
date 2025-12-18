import { extensionThemes, themeToCSSProperties, type ExtensionTheme } from '@/services/extensionThemes';

import type { UserSettings } from '@/types/theme';

/**
 * Composable for managing extension UI theme
 * Reactively updates based on user's global theme selection
 * Injects CSS custom properties into document root
 */
export function useExtensionTheme(settings: Ref<UserSettings>) {
  // System preference detection
  const prefersDark = ref(false);
  let mediaQuery: MediaQueryList | null = null;

  const updateSystemPreference = () => {
    try {
      prefersDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      prefersDark.value = false;
    }
  };

  /**
   * Apply CSS custom properties to document root
   */
  const applyThemeToDocument = (properties: Record<string, string>) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    for (const [key, value] of Object.entries(properties)) {
      root.style.setProperty(key, value);
    }
  };

  const init = () => {
    updateSystemPreference();
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener?.('change', updateSystemPreference);
    } catch {
      // Ignore if matchMedia not available
    }
  };

  const destroy = () => {
    try {
      mediaQuery?.removeEventListener?.('change', updateSystemPreference);
    } catch {
      // Ignore cleanup errors
    }
  };

  /**
   * Resolve system-auto to actual theme ID based on OS preference
   */
  const resolvedThemeId = computed<string>(() => {
    const { globalTheme } = settings.value;
    if (globalTheme === 'system-auto') {
      return prefersDark.value ? 'dark' : 'light';
    }
    return globalTheme;
  });

  /**
   * Active extension theme object
   */
  const activeTheme = computed<ExtensionTheme>(() => {
    const themeId = resolvedThemeId.value;
    return extensionThemes[themeId] || extensionThemes.dark;
  });

  /**
   * CSS custom properties for current theme
   */
  const cssProperties = computed(() => {
    return themeToCSSProperties(activeTheme.value);
  });

  // Watch for theme changes and apply to document
  watch(
    cssProperties,
    (properties) => {
      applyThemeToDocument(properties);
    },
    { immediate: true }
  );

  return {
    init,
    destroy,
  };
}
