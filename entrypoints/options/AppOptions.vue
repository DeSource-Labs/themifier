<template>
  <div class="options">
    <header class="options__header">
      <div class="options__title-group">
        <h1 class="options__title">Themifier Settings</h1>
        <p class="options__subtitle">Customize your theme experience</p>
      </div>
      <button
        type="reset"
        class="options__reset-btn"
        :class="{ 'options__reset-btn--confirm': showReset }"
        :disabled="loading"
        @click="handleResetSettings"
      >
        {{ showReset ? 'Confirm reset?' : 'Reset all' }}
      </button>
    </header>

    <div class="options__content">
      <!-- Global Theme Selection -->
      <Card>
        <template #header>Theme Profile</template>
        <template #desc>Select a base color profile for all sites</template>

        <div class="options__grid">
          <button
            type="button"
            class="options__profile-card"
            :class="{ 'options__profile-card--active': settings.globalTheme === 'system-auto' }"
            :disabled="loading || settings.globalTheme === 'system-auto'"
            @click="setTheme('system-auto')"
          >
            <div class="options__profile-swatch" :style="{ background: '#818cf8' }" />
            <div class="options__profile-info">
              <div class="options__profile-label">System Auto</div>
              <p class="options__profile-desc">Follow your OS light/dark preference.</p>
              <div class="options__profile-contrast">Adapts to system</div>
            </div>
          </button>
          <button
            v-for="profile in themeProfiles"
            :key="profile.id"
            type="button"
            class="options__profile-card"
            :class="{ 'options__profile-card--active': settings.globalTheme === profile.id }"
            :disabled="loading || settings.globalTheme === profile.id"
            @click="setTheme(profile.id)"
          >
            <div class="options__profile-swatch" :style="{ background: profile.palette.accent }" />
            <div class="options__profile-info">
              <div class="options__profile-label">
                {{ profile.label }}
              </div>
              <p class="options__profile-desc">
                {{ profile.description }}
              </p>
              <div class="options__profile-contrast">Contrast ≥ {{ profile.minimumContrast ?? 4.5 }}</div>
            </div>
          </button>
        </div>
      </Card>

      <!-- Auto-detection & Accessibility -->
      <Card>
        <template #header>Detection & Accessibility</template>
        <template #desc>Fine-tune how Themifier detects and applies themes</template>

        <div class="options__settings-list">
          <div class="options__setting-item">
            <div class="options__setting-info">
              <div class="options__setting-title">Auto-detect Site Theme</div>
              <p class="options__setting-desc">
                Automatically analyze websites to detect if they're designed for light or dark mode. Helps prevent
                unnecessary transformations. We recommend keeping this enabled for the best experience.
              </p>
            </div>
            <Switch :value="settings.enableAutoDetect" :loading="loading" @change="toggleAutoDetect" />
          </div>
        </div>
      </Card>

      <!-- Per-site overrides list -->
      <Collapsible>
        <template #header>Per-site overrides</template>
        <template #value>{{ allSiteEntries.length }} sites</template>

        <div class="options__tabs">
          <button
            type="button"
            class="options__tab"
            :class="{ 'options__tab--active': !allSitesShown }"
            @click="allSitesShown = false"
          >
            Custom ({{ overridedSites.length }})
          </button>
          <button
            type="button"
            class="options__tab"
            :class="{ 'options__tab--active': allSitesShown }"
            @click="allSitesShown = true"
          >
            All ({{ allSiteEntries.length }})
          </button>
        </div>

        <div class="options__site-list">
          <div v-if="isDisplayedSitesEmpty" class="options__site-empty">
            <span v-if="allSitesShown">No sites tracked yet.</span>
            <span v-else>No custom overrides yet. Open the popup on a site to add overrides.</span>
          </div>
          <template v-else>
            <div v-for="[domain, pref] in displayedSites" :key="domain" class="options__site-item">
              <div class="options__site-info">
                <div class="options__site-domain">
                  {{ domain }}
                </div>
                <div class="options__site-meta">
                  <span>Forced: {{ pref.enforcedTheme ?? 'inherit' }}</span>
                  <span>Excluded: {{ pref.isExcluded ? 'yes' : 'no' }}</span>
                  <span>Advanced: {{ pref.advancedDynamic ? 'on' : 'off' }}</span>
                  <span>Updated: {{ formatTimestamp(pref.lastUpdated) }}</span>
                </div>
              </div>
              <button
                class="options__remove-btn"
                type="button"
                :disabled="loading"
                @click="removeSiteFromPreferences(domain)"
              >
                Remove
              </button>
            </div>
          </template>
        </div>
      </Collapsible>

      <!-- About & Info -->
      <Card>
        <template #header>About Themifier</template>

        <div class="options__about">
          <div class="options__about-section">
            <h3 class="options__about-title">How it works</h3>
            <p class="options__about-text">
              Themifier detects the color scheme of websites and automatically applies your preferred theme profile. You
              can override specific sites, exclude them entirely, or force a particular theme.
            </p>
          </div>

          <div class="options__about-section">
            <h3 class="options__about-title">Privacy</h3>
            <p class="options__about-text">
              All settings are stored locally in your browser. No data is sent to external servers. Themifier respects
              your privacy.
            </p>
          </div>

          <div class="options__about-section">
            <h3 class="options__about-title">Per-Site Control</h3>
            <p class="options__about-text">
              Click the Themifier icon in your extensions menu to open the popup on any website. There you can force a
              specific theme, exclude sites, or enable advanced dynamic mode for precise theme matching.
            </p>
          </div>

          <div class="options__about-badges">
            <Badge variant="info">Open-source</Badge>
            <Badge variant="success">Privacy-first</Badge>
            <Badge variant="default">100% Local</Badge>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import Badge from '@/components/Badge.vue';
import Card from '@/components/Card.vue';
import Collapsible from '@/components/Collapsible.vue';
import Switch from '@/components/Switch.vue';
import { useExtensionTheme } from '@/composables/useExtensionTheme';
import { themeProfiles } from '@/services/themeProfiles';
import { useSettingsStore } from '@/store/settings';

import type { ThemeIdWithAuto } from '@/types/theme';

const settingsStore = useSettingsStore();
const { settings, unsubscribe } = storeToRefs(settingsStore);
const { setGlobalTheme, subscribe, toggleAutoDetection, resetAllSettings, removeSitePreference } = settingsStore;
const extensionTheme = useExtensionTheme(settings);

const showReset = ref(false);
const loading = ref(false);
const allSitesShown = ref(false);
const allSiteEntries = computed(() => Object.entries(settings.value.perSite ?? {}));
const overridedSites = computed(() =>
  allSiteEntries.value.filter(([_, pref]) => pref.enforcedTheme || pref.isExcluded || pref.advancedDynamic)
);
const displayedSites = computed(() => (allSitesShown.value ? allSiteEntries.value : overridedSites.value));
const isDisplayedSitesEmpty = computed(() => displayedSites.value.length === 0);

const formatTimestamp = (ts?: number) => {
  if (!ts) return 'Never';
  const d = new Date(ts);
  return d.toLocaleString();
};

const handleResetSettings = async () => {
  if (loading.value) return;
  if (!showReset.value) {
    showReset.value = true;
    setTimeout(() => {
      showReset.value = false;
    }, 3000);
    return;
  }
  loading.value = true;
  await resetAllSettings();
  showReset.value = false;
  loading.value = false;
};

const toggleAutoDetect = async (value: boolean) => {
  if (loading.value) return;
  loading.value = true;
  await toggleAutoDetection(value);
  loading.value = false;
};

const setTheme = async (theme: ThemeIdWithAuto) => {
  if (loading.value) return;
  loading.value = true;
  await setGlobalTheme(theme);
  loading.value = false;
};

const removeSiteFromPreferences = async (domain: string) => {
  if (loading.value) return;
  loading.value = true;
  await removeSitePreference(domain);
  loading.value = false;
};

onBeforeMount(() => {
  subscribe();
});

onMounted(() => {
  extensionTheme.init();
});

onBeforeUnmount(() => {
  extensionTheme.destroy();
  unsubscribe.value?.();
});
</script>

<style scoped lang="scss">
.options {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--ext-border-color);
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--ext-text-primary);
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 0.95rem;
    color: var(--ext-text-muted);
    font-weight: 400;
    letter-spacing: 0.1px;
  }

  &__reset-btn {
    padding: 0.6rem 1.2rem;
    border-radius: 0.75rem;
    background: var(--ext-hover-bg);
    border: 1px solid var(--ext-border-hover);
    color: var(--ext-accent-light);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.2px;

    &:hover:not(.options__reset-btn--confirm) {
      background: var(--ext-active-bg);
      border-color: var(--ext-accent);
      box-shadow: var(--ext-shadow-md);
    }

    &--confirm {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--ext-error);

      &:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: rgba(239, 68, 68, 0.5);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      }
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  &__profile-card {
    padding: 1rem;
    border-radius: 0.875rem;
    background: var(--ext-hover-bg);
    border: 1.5px solid var(--ext-border-color);
    cursor: pointer;
    transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    display: flex;
    gap: 0.75rem;

    &:hover {
      background: var(--ext-active-bg);
      border-color: var(--ext-border-hover);
    }

    &--active {
      background: var(--ext-active-bg);
      border-color: var(--ext-accent);
      box-shadow: var(--ext-shadow-lg);
    }
  }

  &__profile-swatch {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  &__profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }

  &__profile-label {
    font-weight: 700;
    color: var(--ext-text-primary);
    font-size: 0.95rem;
    letter-spacing: -0.2px;
  }

  &__profile-desc {
    font-size: 0.8rem;
    color: var(--ext-text-muted);
    line-height: 1.4;
    font-weight: 400;
  }

  &__profile-contrast {
    font-size: 0.75rem;
    color: var(--ext-accent-light);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 0.25rem;
  }

  &__settings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  &__setting-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__setting-title {
    font-weight: 700;
    color: var(--ext-text-primary);
    font-size: 0.95rem;
    letter-spacing: -0.2px;
  }

  &__setting-desc {
    font-size: 0.8rem;
    color: var(--ext-text-muted);
    line-height: 1.5;
    font-weight: 400;
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--ext-border-color);
  }

  &__tab {
    padding: 0.65rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--ext-text-muted);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.2px;

    &:hover {
      color: var(--ext-accent-light);
    }

    &--active {
      border-bottom-color: var(--ext-accent);
      color: var(--ext-accent-light);
    }
  }

  &__site-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  &__site-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem;
    border-radius: 0.75rem;
    background: var(--ext-hover-bg);
    border: 1px solid var(--ext-border-color);
    transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: var(--ext-active-bg);
      border-color: var(--ext-border-hover);
    }
  }

  &__site-info {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  &__site-domain {
    font-weight: 700;
    color: var(--ext-text-primary);
    font-size: 0.95rem;
    letter-spacing: -0.2px;
    word-break: break-all;
  }

  &__site-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.35rem 0.75rem;
    color: var(--ext-text-muted);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  &__site-empty {
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px dashed var(--ext-border-hover);
    color: var(--ext-text-muted);
    background: var(--ext-hover-bg);
    text-align: center;
    font-size: 0.85rem;
  }

  &__remove-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 0.625rem;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

    &:hover:enabled {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.45);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__about {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__about-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__about-title {
    font-weight: 700;
    color: var(--ext-text-primary);
    font-size: 0.95rem;
    letter-spacing: -0.2px;
  }

  &__about-text {
    font-size: 0.85rem;
    color: var(--ext-text-muted);
    line-height: 1.6;
    font-weight: 400;
  }

  &__about-badges {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .options {
    padding: 1.5rem 1rem;
    gap: 1.5rem;

    &__header {
      flex-direction: column;
      gap: 1rem;
    }

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
