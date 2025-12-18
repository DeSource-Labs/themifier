/**
 * Content Script - Main Integration Point
 *
 * Orchestrates the theme transformation pipeline:
 * 1. Fetch user settings and theme preferences
 * 2. Detect page theme tendency (auto-detect)
 * 3. Resolve which theme profile to apply
 * 4. Initialize dynamic theme engine with color transformations
 * 5. Listen for user-initiated theme changes
 */

import { getEngineInstance } from '@/services/dynamicThemeEngine';
import { detectTheme } from '@/services/themeDetection';
import { resolveProfile } from '@/services/themeProfiles';

import type { RuntimeMessage, RuntimeResponse } from '@/types/messages';
import type { DetectionResult, ThemeId, ThemeIdWithAuto, UserSettings } from '@/types/theme';

type MessageResponse = RuntimeResponse | undefined;

/**
 * Send a message to the background service worker
 * Handles communication for settings fetch, preferences, and detection reporting
 * @param message RuntimeMessage to send
 * @returns Promise resolving to response or error response on failure
 */
function sendRuntimeMessage(message: RuntimeMessage): Promise<MessageResponse> {
  return new Promise((resolve) => {
    if (!chrome?.runtime?.sendMessage) {
      resolve({ type: 'error', message: 'runtime unavailable' });
      return;
    }
    chrome.runtime.sendMessage(message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        resolve({ type: 'error', message: chrome.runtime.lastError.message ?? 'unknown error' });
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Fetch user settings from storage
 * @returns Promise resolving to UserSettings or null if unavailable
 */
async function fetchSettings(): Promise<UserSettings | null> {
  const response = await sendRuntimeMessage({ type: 'get-settings' });
  if (response?.type === 'settings') return response.settings;
  return null;
}

/**
 * Report detected theme characteristics to analytics
 * @param domain Current domain
 * @param detection Detection result with theme tendency
 */
async function reportDetection(domain: string, detection: DetectionResult) {
  await sendRuntimeMessage({ type: 'report-detection', domain, detection });
}

/**
 * Determine which theme to apply based on settings and detection
 * @param settings User settings
 * @param domain Current domain
 * @returns ThemeId to apply, or null if no theme should be applied
 *
 * Priority:
 * 1. Per-site enforced theme (highest)
 * 2. Global theme setting
 * 3. System color scheme preference
 * 4. None / null (lowest)
 */
function resolveDesiredTheme(settings: UserSettings, domain: string): ThemeId | null {
  const site = settings.perSite[domain];
  let theme: ThemeIdWithAuto | undefined = site?.enforcedTheme ?? settings.globalTheme;

  if (theme === 'system-auto') {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  if (!theme) return null;
  return theme;
}

/**
 * Check if theme should actually be applied
 * @param theme Resolved theme
 * @param detection Auto-detected theme characteristics (if enabled)
 * @param settings User settings
 * @param domain Current domain
 * @returns true if theme should be applied, false otherwise
 *
 * Returns false if:
 * - Site is excluded
 * - Auto-detection says page already matches theme (unnecessary transformation)
 */
function shouldApply(
  theme: ThemeId,
  detection: DetectionResult | null,
  settings: UserSettings,
  domain: string
): boolean {
  const site = settings.perSite[domain];
  if (site?.isExcluded) return false;
  if (site?.enforcedTheme) return true;
  if (!settings.enableAutoDetect) return true;
  if (!detection) return true;

  if (theme === 'dark' && detection.tendency === 'dark') return false;
  if (theme === 'light' && detection.tendency === 'light') return false;

  return true;
}

/**
 * Apply theme profile to page using dynamic engine
 * @param theme Theme ID to apply
 * @param settings User settings for configuration
 * @param domain Current domain
 *
 * Initializes DynamicThemeEngine with:
 * - Color transformation
 * - Color registry for consistency
 * - Inline style tracking with data attributes
 * - Support for all 8 theme modes
 */
function applyProfile(theme: ThemeId, settings: UserSettings, domain: string) {
  const profile = resolveProfile(theme, settings);
  if (!profile) return;

  const advancedDynamic = settings.perSite[domain]?.advancedDynamic === true;

  const engine = getEngineInstance();
  engine.updateTheme(profile, { enableInlineObservation: advancedDynamic });
}

/**
 * Runs on page load and when settings change
 *
 * Flow:
 * 1. Get current domain
 * 2. Fetch user settings
 * 3. Auto-detect page theme (if enabled)
 * 4. Resolve which theme profile to apply
 * 5. Check if application is necessary
 * 6. Apply profile with dynamic engine
 *
 * @param shouldReport - Whether to report detection result to background (only on explicit request)
 * @returns Promise resolving to detection result (if performed)
 */
async function runContentPipeline(shouldReport = false): Promise<DetectionResult | null> {
  const domain = window.location.hostname;
  console.info('[Themifier][Content] Running pipeline for domain:', domain);
  const engine = getEngineInstance();
  const settings = await fetchSettings();
  if (!settings) {
    return null;
  }

  // IMPORTANT: Clear old theme FIRST so detection sees natural page colors
  // (not colors already transformed by previous theme)
  engine.clear();

  // Auto-detect page theme tendency on the CLEAN page
  const detection = settings.enableAutoDetect ? detectTheme(document) : null;
  if (detection && shouldReport) {
    reportDetection(domain, detection).catch(() => {
      // Silently fail - reporting is non-critical
    });
  }

  // Resolve desired theme for this domain
  const desiredTheme = resolveDesiredTheme(settings, domain);
  if (!desiredTheme) {
    return detection;
  }

  // Check if transformation is actually needed
  const should = shouldApply(desiredTheme, detection, settings, domain);
  if (!should) {
    return detection;
  }

  // Apply the theme profile
  applyProfile(desiredTheme, settings, domain);
  return detection;
}

/**
 * Main content script initialization
 *
 * Exports a defineContentScript configuration that:
 * 1. Runs on all URLs (with whitelist/blacklist in background)
 * 2. Executes on document load
 * 3. Listens for runtime messages from background/popup
 * 4. Provides detection updates when requested
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Run initial theme application pipeline
    // also report detection so popup sees it without manual refresh
    runContentPipeline(true).catch((error) => {
      console.warn('Themifier: initial pipeline failed', error);
    });

    // Listen for runtime messages from background/popup
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
      if (message.type === 'settings-changed') {
        runContentPipeline().catch((error) => {
          console.warn('Themifier: settings-changed pipeline failed', error);
          sendResponse({ type: 'error', message: 'Detection failed' });
        });
        return;
      }

      // Handle detection request from popup/background
      if (message.type === 'request-detection') {
        runContentPipeline(true) // Report detection when explicitly requested
          .then((detection) => {
            sendResponse({ type: 'detection', detection });
          })
          .catch((error) => {
            console.warn('Themifier: request-detection failed', error);
            sendResponse({ type: 'error', message: 'Detection failed' });
          });

        // Return true to indicate we'll respond asynchronously
        return true;
      }
    });
  },
});
