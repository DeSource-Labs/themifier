import { loadSettings, updateGlobalSetting, updateSitePreference } from '@/services/storageService';
import { themeProfiles } from '@/services/themeProfiles';

import type { RuntimeMessage, RuntimeResponse } from '@/types/messages';
import type { SitePreference, ThemeId, ThemeIdWithAuto } from '@/types/theme';

type ProfileBadges = Record<ThemeIdWithAuto, { label: string; emoji: string }>;

const badgeEmojis: Record<ThemeId, string> = {
  light: '🤍',
  dark: '🖤',
  'high-contrast': '💛',
  'night-warm': '🧡',
  'colorblind-protanopia': '💙',
  'colorblind-deuteranopia': '💛',
  'colorblind-tritanopia': '🩷',
  'reduced-motion': '🩵',
};
const badgeProiles = themeProfiles.reduce<ProfileBadges>(
  (acc, { id, label }) => {
    acc[id] = { label, emoji: badgeEmojis[id] };
    return acc;
  },
  { 'system-auto': { label: 'Auto', emoji: '' } } as ProfileBadges
);
// Extra newline for better readability in tooltip ('Has access to this site' at the bottom)
const appTitle = 'Themifier - Custom Themes for Websites\n';

/**
 * Extract domain hostname from URL
 * @param url Full URL string
 * @returns Domain hostname or null if URL is invalid
 */
function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function evaluateBadge(domain: string | null, tabId: number) {
  if (!chrome?.action) return;
  if (!domain) {
    await chrome.action.setBadgeText({ text: '', tabId });
    await chrome.action.setTitle({ title: appTitle, tabId });
    return;
  }

  const settings = await loadSettings();
  const site = settings.perSite[domain];
  const isExcluded = site?.isExcluded;
  if (isExcluded) {
    const title = `Disabled for this site\n\n${appTitle}`;
    await chrome.action.setBadgeText({ text: 'OFF', tabId });
    await chrome.action.setBadgeBackgroundColor({ color: '#f97316e6', tabId }); // semi-transparent orange
    await chrome.action.setTitle({ title, tabId });
    return;
  }
  const enforced = site?.enforcedTheme;
  const selectedTheme = enforced ?? settings.globalTheme;
  const badge = badgeProiles[selectedTheme] ?? badgeProiles['system-auto'];
  const color = selectedTheme === 'dark' ? '#ffffffcc' : '#000000cc'; // semi-transparent white/black
  const title = `${badge.label} theme\n\n${appTitle}`;
  await chrome.action.setBadgeText({ text: badge.emoji ? ` ${badge.emoji} ` : '', tabId });
  await chrome.action.setBadgeBackgroundColor({ color: color, tabId }); // semi-transparent black
  await chrome.action.setTitle({ title, tabId });
}

/**
 * Update the action badge for a specific tab based on theme application status
 * @param tabId Tab ID to update badge for
 */
async function syncBadgeForTab(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = getDomainFromUrl(tab.url);
    await evaluateBadge(domain, tab.id ?? tabId);
  } catch {
    // Silently fail - tab may no longer exist
  }
}

async function handleMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  switch (message.type) {
    case 'get-settings': {
      const settings = await loadSettings();
      return { type: 'settings', settings };
    }
    case 'get-site-preference': {
      const settings = await loadSettings();
      const preference = settings.perSite[message.domain];
      return { type: 'site-preference', preference };
    }
    case 'set-global-theme': {
      await updateGlobalSetting('globalTheme', message.theme);
      debouncedBroadcast(); // Only broadcast on actual user setting changes
      return { type: 'ack' };
    }
    case 'set-site-preference': {
      await updateSitePreference(message.domain, message.preference as Partial<SitePreference>);
      debouncedBroadcast(); // Only broadcast on actual user setting changes
      return { type: 'ack' };
    }
    case 'report-detection': {
      // Don't broadcast for detection reports - they don't affect theme rendering
      await updateSitePreference(message.domain, { lastDetection: message.detection });
      return { type: 'ack' };
    }
    default:
      return { type: 'error', message: 'Unknown message type' };
  }
}

let broadcastTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Broadcast settings change notification to all content scripts
 * Content scripts will rerun the theme pipeline on all open pages
 */
async function broadcastSettingsChanged() {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map((tab) =>
        tab.id ? chrome.tabs.sendMessage(tab.id, { type: 'settings-changed' }).catch(() => {}) : Promise.resolve()
      )
    );
  } catch {
    // Silently fail - some tabs may not have content script
  }
}

function debouncedBroadcast() {
  if (broadcastTimeout) {
    clearTimeout(broadcastTimeout);
  }
  // Debounce broadcasts to prevent spam when multiple settings change rapidly
  // (e.g., user adjusts multiple theme sliders) - only broadcast the final state
  broadcastTimeout = setTimeout(() => {
    broadcastSettingsChanged().catch(() => {});
    broadcastTimeout = null;
  }, 100);
}

export default defineBackground(() => {
  // Handle messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch(() => {
        // Return error response on any handler failure
        sendResponse({ type: 'error', message: 'Internal error' });
      });
    return true;
  });

  // When user activates a tab, sync badge and reapply theme
  // This ensures theme consistency when switching between tabs
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    syncBadgeForTab(tabId).catch(() => {});
    chrome.tabs.sendMessage(tabId, { type: 'settings-changed' }).catch(() => {
      // No content script on privileged pages - safe to ignore
    });
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      await syncBadgeForTab(tabId);
    }
  });

  // Update badge when storage changes (from other browser instances)
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'sync') return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await syncBadgeForTab(tab.id);
    } catch {
      // Silently fail - tab may no longer exist
    }
  });
});
