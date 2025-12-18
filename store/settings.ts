import { defineStore } from 'pinia';

import {
  getDefaultSettings,
  loadSettings,
  onSettingsChanged,
  updateSitePreference as updateSitePreferenceService,
  resetAllSettings as resetAllSettingsService,
  removeSitePreference as removeSitePreferenceService,
  updateGlobalSetting as updateGlobalSettingService,
} from '@/services/storageService';

import type { SitePreference, ThemeIdWithAuto, UserSettings } from '@/types/theme';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(getDefaultSettings());
  const initialized = ref(false);
  const unsubscribe = ref<(() => void) | null>(null);

  const subscribe = async () => {
    if (initialized.value) return;
    initialized.value = true;
    settings.value = await loadSettings();
    unsubscribe.value = onSettingsChanged((next) => {
      settings.value = next;
    });
  };

  const globalTheme = computed(() => settings.value.globalTheme);
  const perSite = computed(() => settings.value.perSite);

  const setGlobalTheme = async (theme: ThemeIdWithAuto) => {
    await updateGlobalSettingService('globalTheme', theme);
  };

  const toggleAutoDetection = async (enabled: boolean) => {
    await updateGlobalSettingService('enableAutoDetect', enabled);
  };

  const updateSitePreference = async (domain: string, preference: Partial<SitePreference>) => {
    await updateSitePreferenceService(domain, preference);
  };

  const removeSitePreference = async (domain: string) => {
    await removeSitePreferenceService(domain);
  };

  const resetAllSettings = async () => {
    await resetAllSettingsService();
  };

  return {
    settings,
    globalTheme,
    perSite,
    subscribe,
    unsubscribe,
    setGlobalTheme,
    toggleAutoDetection,
    updateSitePreference,
    removeSitePreference,
    resetAllSettings,
  };
});
