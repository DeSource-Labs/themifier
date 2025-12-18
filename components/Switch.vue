<template>
  <div
    class="switch"
    :class="{ 'switch--disabled': loading }"
    role="switch"
    :aria-checked="value"
    tabindex="0"
    @click="toggle"
    @keydown="onKeydown"
    @focus="focused = true"
    @blur="focused = false"
  >
    <span class="switch__track" :class="{ 'switch__track--on': value }">
      <span
        class="switch__thumb"
        :class="{ 'switch__thumb--on': value, 'switch__thumb--focus': focused }"
        aria-hidden="true"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value?: boolean;
    loading?: boolean;
  }>(),
  {
    value: false,
    loading: false,
  }
);
const emit = defineEmits<(e: 'change', value: boolean) => void>();
const focused = ref(false);

const toggle = () => {
  if (props.loading) return;
  emit('change', !props.value);
};

const onKeydown = (e: KeyboardEvent) => {
  if (props.loading) return;
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
    e.preventDefault();
    toggle();
  }
};
</script>

<style lang="scss" scoped>
$width: 44px;
$height: 24px;
$thumb-size: 20px;

.switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus {
    outline: none;
  }
}

.switch__track {
  position: relative;
  width: $width;
  height: $height;
  border-radius: $height;
  background: var(--ext-hover-bg);
  border: 1px solid var(--ext-border-hover);
  transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  box-shadow: var(--ext-shadow-sm);

  &--on {
    background: var(--ext-accent);
    border-color: var(--ext-accent-dark);
    box-shadow: var(--ext-shadow-md);
  }
}

.switch__thumb {
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: $thumb-size;
  height: $thumb-size;
  border-radius: 50%;
  background: var(--ext-text-primary);
  box-shadow: var(--ext-shadow-sm);
  transition: all var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;

  &--on {
    transform: translateY(-50%) translateX(calc(#{$width} - #{$thumb-size} - 4px));
    box-shadow: var(--ext-shadow-md);
  }

  &--focus {
    box-shadow:
      var(--ext-shadow-sm),
      0 0 0 3px var(--ext-border-hover);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .switch__track,
  .switch__thumb {
    transition: none;
  }
}
</style>
