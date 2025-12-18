import type { SitePreference, UserSettings } from '@/types/theme';

const STORAGE_KEY = 'themifier.settings.v1';

const defaultSettings: UserSettings = {
  globalTheme: 'system-auto',
  colorBlindness: 'none',
  preferReducedMotion: false,
  enableAutoDetect: true,
  perSite: {},
};

const hasChromeStorage = typeof chrome !== 'undefined' && !!chrome.storage?.sync;
const memoryStore: Record<string, unknown> = {};

type SettingsListener = (settings: UserSettings) => void;

// Local event emitter for non-chrome-storage environments
const localSettingsListeners = new Set<SettingsListener>();

function normalizeSettings(s: UserSettings): UserSettings {
  return { ...defaultSettings, ...s, perSite: s?.perSite ?? {} };
}

function addLocalSettingsListener(listener: SettingsListener): () => void {
  localSettingsListeners.add(listener);
  return () => localSettingsListeners.delete(listener);
}

function emitLocalSettingsChange(settings: UserSettings): void {
  const normalized = normalizeSettings(settings);
  for (const listener of [...localSettingsListeners]) {
    try {
      listener(normalized);
    } catch {
      // ignore listener errors
    }
  }
}

/**
 * Read a value from Chrome storage.sync with fallback to in-memory cache
 * Falls back to default if chrome.storage is unavailable (e.g., in unit tests)
 * @param key Storage key
 * @param fallback Default value if key not found
 * @returns Stored value or fallback
 */
async function readFromStorage<T>(key: string, fallback: T): Promise<T> {
  if (!hasChromeStorage) {
    const cached = memoryStore[key];
    return (cached as T) ?? fallback;
  }

  return await new Promise<T>((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      if (chrome.runtime.lastError) {
        // On read error, use fallback value
        resolve(fallback);
        return;
      }
      const value = result?.[key];
      resolve(value ? (value as T) : fallback);
    });
  });
}

/**
 * Write a value to Chrome storage.sync with fallback to in-memory cache
 * Silently continues on error - storage is best-effort, not critical
 * @param key Storage key
 * @param value Value to store
 */
async function writeToStorage<T>(key: string, value: T): Promise<void> {
  if (!hasChromeStorage) {
    memoryStore[key] = value;
    // Emit local change events when updating settings in non-chrome environments
    if (key === STORAGE_KEY) {
      emitLocalSettingsChange(value as unknown as UserSettings);
    }
    return;
  }

  return await new Promise<void>((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      // Silently ignore storage errors - continue operation regardless
      resolve();
    });
  });
}

export async function loadSettings(): Promise<UserSettings> {
  const stored = await readFromStorage<UserSettings>(STORAGE_KEY, defaultSettings);
  return {
    ...defaultSettings,
    ...stored,
    perSite: stored?.perSite ?? {},
  };
}

/**
 * Save user settings to Chrome storage with fallback to memory store
 * @param settings Complete UserSettings object to persist
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await writeToStorage<UserSettings>(STORAGE_KEY, settings);
}

/**
 * Reset all settings to defaults
 * @returns Promise resolving when reset is complete
 */
export function resetAllSettings(): Promise<void> {
  return saveSettings(getDefaultSettings());
}

/**
 * Update theme preference for a specific domain
 * Adds/updates per-site overrides while preserving other settings
 * @param domain Domain hostname
 * @param preference Partial SitePreference to merge with existing
 * @returns Updated UserSettings
 */
export async function updateSitePreference(domain: string, preference: Partial<SitePreference>): Promise<UserSettings> {
  const settings = await loadSettings();
  const existing = settings.perSite[domain] ?? {};
  settings.perSite[domain] = {
    ...existing,
    ...preference,
    lastUpdated: Date.now(),
  };
  await saveSettings(settings);
  return settings;
}

/**
 * Set the global theme preference
 * Applies to all domains except those with explicit site preferences
 * @param key setting key to update
 * @param value New value for the setting
 * @returns Updated UserSettings
 */
export async function updateGlobalSetting<TK extends keyof UserSettings>(
  key: TK,
  value: UserSettings[TK]
): Promise<UserSettings> {
  const settings = await loadSettings();
  settings[key] = value;
  await saveSettings(settings);
  return settings;
}

/**
 * Remove site-specific preference for a domain
 * Reverts the domain to using global settings
 * @param domain Domain hostname
 * @returns Updated UserSettings
 */
export async function removeSitePreference(domain: string): Promise<UserSettings> {
  const settings = await loadSettings();
  if (domain in settings.perSite) {
    delete settings.perSite[domain];
    await saveSettings(settings);
  }
  return settings;
}

/**
 * Subscribe to settings changes across browser instances
 * Fires when settings change via chrome.storage.sync (which syncs across browser windows)
 * In non-chrome environments, uses a local event emitter.
 * @param callback Function called with new UserSettings when storage changes
 * @returns Unsubscribe function to remove listener
 */
export function onSettingsChanged(callback: SettingsListener): () => void {
  if (hasChromeStorage) {
    const handler: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'sync' || !changes[STORAGE_KEY]) return;
      const newValue = changes[STORAGE_KEY].newValue as UserSettings;
      callback({ ...defaultSettings, ...newValue, perSite: newValue?.perSite ?? {} });
    };
    chrome.storage.onChanged.addListener(handler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }
  // Local emitter fallback
  return addLocalSettingsListener(callback);
}

/**
 * Get a fresh copy of default settings
 * Useful for resetting to defaults
 * @returns Default UserSettings object
 */
export function getDefaultSettings(): UserSettings {
  return structuredClone(defaultSettings);
}
