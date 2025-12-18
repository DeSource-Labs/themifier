<template>
  <details class="collapsible">
    <summary class="collapsible__header">
      <div>
        <p class="collapsible__title">
          <slot name="header" />
        </p>
        <p class="collapsible__value">
          <slot name="value" />
        </p>
      </div>
      <svg
        class="collapsible__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </summary>
    <div class="collapsible__content">
      <slot />
    </div>
  </details>
</template>

<style scoped lang="scss">
.collapsible {
  border: 1px solid var(--ext-border-color);
  border-radius: 1rem;
  background: var(--ext-hover-bg);
  backdrop-filter: blur(var(--ext-glass-blur));
  user-select: none;
  overflow: hidden;
  transition: all var(--ext-transition-speed) ease;

  &:hover {
    border-color: var(--ext-border-hover);
    background: var(--ext-active-bg);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    cursor: pointer;
    transition: all var(--ext-transition-speed) ease;
  }

  &__title {
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--ext-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  &__value {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--ext-text-primary);
    margin-top: 0.375rem;
  }

  &__icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--ext-accent-light);
  }

  &[open] .collapsible__icon {
    transform: rotate(180deg);
  }

  &__content {
    padding: 0 1.25rem 1.25rem 1.25rem;
    animation: slideDown var(--ext-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
