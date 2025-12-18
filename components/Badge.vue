<template>
  <span class="badge" :class="[`badge--${variant}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'info' | 'success' | 'warning' | 'error' }>(), {
  variant: 'default',
});
</script>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  background-color: var(--ext-hover-bg);
  color: var(--ext-text-secondary);
  backdrop-filter: blur(var(--ext-glass-blur));
  border: 1px solid var(--ext-border-color);
  transition: all var(--ext-transition-speed) ease;

  &--info {
    background: var(--ext-active-bg);
    color: var(--ext-info);
    border-color: var(--ext-border-hover);
  }

  &--success {
    background: var(--ext-active-bg);
    color: var(--ext-success);
    border-color: var(--ext-border-hover);
  }

  &--warning {
    background: var(--ext-active-bg);
    color: var(--ext-warning);
    border-color: var(--ext-border-hover);
  }

  &--error {
    background: var(--ext-active-bg);
    color: var(--ext-error);
    border-color: var(--ext-border-hover);
  }
}
</style>
