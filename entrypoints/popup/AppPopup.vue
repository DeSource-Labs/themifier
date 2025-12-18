<template>
  <div class="popup">
    <header>
      <div class="header">
        <p class="header__title">Active site</p>
        <p class="header__domain">
          {{ loadingDomain ? 'Loading…' : (activeDomain ?? 'Unavailable') }}
        </p>
      </div>
      <Badge v-if="isExcluded" variant="warning">Bypassed</Badge>
      <Badge v-else-if="forcedTheme !== 'inherit'" variant="success">Forced</Badge>
      <Badge v-else variant="default">Auto</Badge>
    </header>
    <Collapsible>
      <template #header>Global theme</template>
      <template #value>
        {{ globalThemeName }}
      </template>
      <div class="global">
        <ModeItem
          v-for="profile in themeCards"
          :key="profile.id"
          :item="profile"
          :active="profile.id === settings.globalTheme"
          @click="handleGlobalTheme(profile.id)"
        />
      </div>
    </Collapsible>
    <Collapsible>
      <template #header>This site</template>
      <template #value>Override behavior</template>
      <div class="overrides">
        <div class="overrides__item">
          <div class="overrides__header">
            <p class="overrides__title">Exclude from Themifier</p>
            <p class="overrides__desc">Skip detection and overrides for this domain.</p>
          </div>
          <Switch :value="isExcluded" @change="handleExclude" />
        </div>
        <div class="overrides__item">
          <div class="overrides__header">
            <p class="overrides__title">Advanced dynamic mode</p>
            <p class="overrides__desc">Enable full inline-style watching for this site (more accurate, more CPU).</p>
          </div>
          <Switch :value="advancedDynamic" @change="handleAdvancedDynamic" />
        </div>
        <div class="overrides__item overrides__item--grid">
          <div class="overrides__header">
            <p class="overrides__title">Force theme</p>
          </div>
          <div class="overrides__grid">
            <button
              v-for="profile in ['inherit', 'light', 'dark', 'high-contrast']"
              :key="profile"
              type="button"
              class="overrides__grid-item"
              :class="{
                'overrides__grid-item--active': forcedTheme === profile,
              }"
              :disabled="forcedTheme === profile || isExcluded"
              @click="handleForceTheme(profile as ForceTheme)"
            >
              {{ profile === 'inherit' ? 'use global' : profile.replace('-', ' ') }}
            </button>
          </div>
        </div>
      </div>
    </Collapsible>
    <Card>
      <template #header>Detection status</template>
      <template #desc>Live snapshot</template>
      <template #action>
        <RefreshButton :loading="detectionLoading" @click="requestDetectionRefresh" />
      </template>
      <div v-if="detectionDisplay" class="detection">
        <div class="detection__item">
          <span class="detection__label">Updated</span>
          <span class="detection__value">
            {{ lastUpdatedLabel }}
          </span>
        </div>
        <div class="detection__item">
          <span class="detection__label">Tendency</span>
          <span class="detection__value">
            {{ detectionDisplay.tendency }}
          </span>
        </div>
        <div class="detection__item">
          <span class="detection__label">Avg luminance</span>
          <span class="detection__value">
            {{ detectionDisplay.averageLuminance.toFixed(2) }}
          </span>
        </div>
        <div class="detection__item">
          <span class="detection__label">Frameworks</span>
          <span class="detection__value">
            {{ detectionDisplay.frameworks.tailwind ? 'Tailwind ' : '' }}
            {{ detectionDisplay.frameworks.bootstrap ? 'Bootstrap ' : '' }}
            {{ detectionDisplay.frameworks.cssVariables ? 'CSS Vars' : 'Plain CSS' }}
          </span>
        </div>
      </div>
      <div v-else class="detection__empty">No detection yet. Will update after content scan.</div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Badge from '@/components/Badge.vue';
import Card from '@/components/Card.vue';
import Collapsible from '@/components/Collapsible.vue';
import ModeItem from '@/components/ModeItem.vue';
import RefreshButton from '@/components/RefreshButton.vue';
import Switch from '@/components/Switch.vue';
import { useExtensionTheme } from '@/composables/useExtensionTheme';
import { useThemifier, type ForceTheme } from '@/composables/useThemifier';

const {
  settings,
  themeCards,
  globalThemeName,
  activeDomain,
  loadingDomain,
  isExcluded,
  forcedTheme,
  advancedDynamic,
  detectionDisplay,
  detectionLoading,
  lastUpdatedLabel,
  handleGlobalTheme,
  handleExclude,
  handleForceTheme,
  handleAdvancedDynamic,
  requestDetectionRefresh,
  resolveActiveDomain,
  subscribe,
  unsubscribe,
} = useThemifier();

const extensionTheme = useExtensionTheme(settings);

onMounted(async () => {
  extensionTheme.init();
  await subscribe();
  resolveActiveDomain();
});

onBeforeUnmount(() => {
  extensionTheme.destroy();
  unsubscribe.value?.();
});
</script>

<style scoped lang="scss">
.popup {
  width: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  &__title {
    font-size: 0.68rem;
    color: var(--ext-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  &__domain {
    font-size: 1rem;
    font-weight: 700;
    color: var(--ext-text-primary);
    letter-spacing: -0.3px;
  }
}

.global {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.overrides {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-radius: 0.875rem;
    background: var(--ext-hover-bg);
    border: 1px solid var(--ext-border-color);
    transition: all var(--ext-transition-speed) ease;

    &:hover {
      background: var(--ext-active-bg);
      border-color: var(--ext-border-hover);
    }

    &--grid {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.9rem;
    }
  }

  &__title {
    font-size: 0.85rem;
    line-height: 1.5;
    font-weight: 600;
    color: var(--ext-text-primary);
    letter-spacing: 0.2px;
  }

  &__desc {
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--ext-text-muted);
    font-weight: 400;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    width: 100%;
  }

  &__grid-item {
    padding: 0.5rem 0.6rem;
    border: 1.5px solid var(--ext-border-hover);
    border-radius: 0.625rem;
    background: var(--ext-hover-bg);
    color: var(--ext-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.2px;

    &:hover:not(:disabled) {
      border-color: var(--ext-accent);
      background: var(--ext-active-bg);
      color: var(--ext-accent-light);
      box-shadow: var(--ext-shadow-md);
      transform: translateY(-1px);
    }

    &:disabled {
      cursor: default;
      border-color: var(--ext-accent);
      background: var(--ext-active-bg);
      color: var(--ext-accent-light);
      box-shadow: var(--ext-shadow-md);
    }
  }
}

.detection {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.85rem;
  line-height: 1.5;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem;
    background: var(--ext-hover-bg);
    border-radius: 0.625rem;
    border: 1px solid var(--ext-border-color);
    transition: all var(--ext-transition-speed) ease;

    &:hover {
      background: var(--ext-active-bg);
      border-color: var(--ext-border-hover);
    }
  }

  &__label {
    color: var(--ext-text-muted);
    font-weight: 500;
    font-size: 0.8rem;
    letter-spacing: 0.2px;
  }

  &__value {
    font-weight: 700;
    color: var(--ext-accent-light);
    font-size: 0.9rem;
    letter-spacing: 0.1px;
  }

  &__empty {
    font-size: 0.8rem;
    color: var(--ext-text-muted);
    padding: 1.1rem;
    text-align: center;
    background: var(--ext-hover-bg);
    border-radius: 0.75rem;
    border: 1px dashed var(--ext-border-hover);
  }
}
</style>
