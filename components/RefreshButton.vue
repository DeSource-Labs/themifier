<template>
  <button class="refresh-button" type="button" :disabled="loading" aria-label="Refresh" @click="handleClick">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      aria-hidden="true"
      role="img"
      width="1rem"
      height="1rem"
      viewBox="0 0 24 24"
      class="refresh-button__icon"
    >
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </g>
    </svg>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

const emit = defineEmits<(e: 'click') => void>();

const handleClick = () => {
  if (props.loading) return;
  emit('click');
};
</script>

<style scoped lang="scss">
.refresh-button {
  background: var(--ext-hover-bg);
  color: var(--ext-accent-light);
  border: 1px solid var(--ext-border-hover);
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    background: var(--ext-active-bg);
    border-color: var(--ext-accent);
    box-shadow: var(--ext-shadow-md);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &__icon {
    width: 1.2rem;
    height: 1.2rem;
    display: block;
    transition: transform calc(var(--ext-transition-speed) * 3) cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:not(:disabled):hover .refresh-button__icon {
    transform: rotate(180deg);
  }
}
</style>
