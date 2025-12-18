import { storeToRefs } from 'pinia';

import { themeProfiles } from '@/services/themeProfiles';
import { useSettingsStore } from '@/store/settings';

import type { ThemeId, DetectionResult, ThemeIdWithAuto } from '@/types/theme';

export type ForceTheme = ThemeId | 'inherit';

const systemCard = {
  id: 'system-auto' as const,
  label: 'Follow system',
  description: 'Use OS preference when available.',
};

export function useThemifier() {
  const settingsStore = useSettingsStore();
  const { settings, unsubscribe } = storeToRefs(settingsStore);
  const { setGlobalTheme, updateSitePreference, subscribe } = settingsStore;

  const activeDomain = ref<string | null>(null);
  const loadingDomain = ref(false);
  const detectionLive = ref<DetectionResult | null>(null);
  const detectionLoading = ref(false);

  const sitePref = computed(() => {
    if (!activeDomain.value) return {};
    return settings.value.perSite[activeDomain.value] ?? {};
  });
  const forcedTheme = computed<ForceTheme>(() => sitePref.value.enforcedTheme ?? 'inherit');
  const isExcluded = computed(() => sitePref.value.isExcluded ?? false);
  const detection = computed(() => sitePref.value.lastDetection);
  const detectionDisplay = computed(() => detectionLive.value ?? detection.value);
  const advancedDynamic = computed(() => sitePref.value.advancedDynamic ?? false);
  const lastUpdatedLabel = computed(() => {
    const ts = sitePref.value.lastUpdated;
    if (!ts) return 'Never';
    const d = new Date(ts);
    return d.toLocaleString();
  });
  const themeCards = computed(() => [systemCard, ...themeProfiles]);
  const globalThemeName = computed(() => {
    const { globalTheme } = settings.value;
    const profile = themeCards.value.find((p) => p.id === globalTheme);
    return profile ? profile.label : 'Unknown';
  });

  const resolveActiveDomain = async () => {
    if (!chrome?.tabs?.query) return;
    loadingDomain.value = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const { hostname } = new URL(tab.url);
        activeDomain.value = hostname;
        detectionLive.value = null;
      }
    } catch (error) {
      console.warn('Themifier: unable to read active tab', error);
      activeDomain.value = null;
    } finally {
      loadingDomain.value = false;
    }
  };

  const handleGlobalTheme = async (theme: ThemeIdWithAuto) => {
    if (theme === settings.value.globalTheme) return;
    await setGlobalTheme(theme);
    requestDetectionRefresh().catch(() => {});
  };

  const handleForceTheme = async (theme: ForceTheme) => {
    if (!activeDomain.value) return;
    const enforcedTheme = theme === 'inherit' ? undefined : theme;
    await updateSitePreference(activeDomain.value, { enforcedTheme });
    requestDetectionRefresh().catch(() => {});
  };

  const handleExclude = async (value: boolean) => {
    if (!activeDomain.value) return;
    await updateSitePreference(activeDomain.value, { isExcluded: value });
    requestDetectionRefresh().catch(() => {});
  };

  const handleAdvancedDynamic = async (value: boolean) => {
    if (!activeDomain.value) return;
    await updateSitePreference(activeDomain.value, { advancedDynamic: value });
    requestDetectionRefresh().catch(() => {});
  };

  const requestDetectionRefresh = async () => {
    if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) return;
    detectionLoading.value = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'request-detection' });
      if (response?.type === 'detection') {
        detectionLive.value = response.detection;
      }
    } catch (error) {
      console.warn('Themifier: detection refresh failed', error);
    } finally {
      detectionLoading.value = false;
    }
  };

  return {
    // refs
    activeDomain,
    loadingDomain,
    detectionLive,
    detectionLoading,
    settings,
    // computed
    sitePref,
    forcedTheme,
    isExcluded,
    detection,
    detectionDisplay,
    advancedDynamic,
    lastUpdatedLabel,
    themeCards,
    globalThemeName,
    // methods
    resolveActiveDomain,
    handleGlobalTheme,
    handleForceTheme,
    handleExclude,
    handleAdvancedDynamic,
    requestDetectionRefresh,
    subscribe,
    unsubscribe,
  };
}
