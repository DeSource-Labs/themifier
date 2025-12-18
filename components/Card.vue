<template>
  <div class="card">
    <div v-if="slots.header" class="card__header">
      <div>
        <p class="card__title">
          <slot name="header" />
        </p>
        <p class="card__desc">
          <slot name="desc" />
        </p>
      </div>
      <slot v-if="slots.action" name="action" />
    </div>
    <div v-if="slots.default" class="card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  header?: () => unknown;
  desc?: () => unknown;
  action?: () => unknown;
  default?: () => unknown;
}>();
</script>

<style scoped lang="scss">
.card {
  border: 1px solid var(--ext-border-color);
  border-radius: 1rem;
  background: var(--ext-hover-bg);
  backdrop-filter: blur(var(--ext-glass-blur));
  overflow: hidden;
  box-shadow: var(--ext-shadow-sm);
  transition: all var(--ext-transition-speed) ease;

  &:hover {
    border-color: var(--ext-border-hover);
    box-shadow: var(--ext-shadow-md);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    padding-bottom: 0;
  }

  &__title {
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--ext-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  &__desc {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--ext-text-primary);
    margin-top: 0.375rem;
  }

  &__body {
    padding: 1.25rem;
  }
}
</style>
