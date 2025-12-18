import type { DetectionResult, SitePreference, ThemeIdWithAuto, UserSettings } from './theme';

export type RuntimeMessage =
  | { type: 'get-settings' }
  | { type: 'get-site-preference'; domain: string }
  | { type: 'set-global-theme'; theme: ThemeIdWithAuto }
  | { type: 'set-site-preference'; domain: string; preference: Partial<SitePreference> }
  | { type: 'report-detection'; domain: string; detection: DetectionResult }
  | { type: 'request-detection' }
  | { type: 'settings-changed' };

export type RuntimeResponse =
  | { type: 'settings'; settings: UserSettings }
  | { type: 'site-preference'; preference: SitePreference | undefined }
  | { type: 'ack' }
  | { type: 'detection'; detection: DetectionResult | null }
  | { type: 'error'; message: string };
