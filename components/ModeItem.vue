<template>
  <button class="mode" type="button" :class="item.id" :disabled="active" @click="emit('click')">
    <span class="mode__title">{{ item.label }}</span>
    <span class="mode__description">{{ item.description }}</span>
  </button>
</template>

<script setup lang="ts">
import { ThemeProfile } from '@/types/theme';

const props = withDefaults(
  defineProps<{
    item: ThemeProfile | { id: 'system-auto'; label: string; description: string };
    active?: boolean;
  }>(),
  {
    active: false,
  }
);

const emit = defineEmits<(e: 'click') => void>();
</script>

<style scoped lang="scss">
.mode {
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 2px solid var(--ext-border-hover);
  border-radius: 0.875rem;
  background: var(--ext-hover-bg);
  transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(var(--ext-glass-blur));

  &:hover:not(:disabled) {
    border-color: var(--ext-accent);
    background: var(--ext-active-bg);
    box-shadow: var(--ext-shadow-md);
    transform: translateY(-2px);
  }

  &:disabled {
    cursor: default;
    border-color: var(--ext-accent);
    background: var(--ext-active-bg);
    box-shadow: var(--ext-shadow-lg);
  }

  &__title {
    display: block;
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--ext-text-primary);
    letter-spacing: 0.2px;
  }

  &__description {
    display: block;
    text-wrap: balance;
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--ext-text-muted);
    margin-top: 0.375rem;
    font-weight: 400;
  }
}
</style>
