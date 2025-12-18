import type { FrameworkDetection } from '@/types/theme';

function hasPropertyPrefix(style: CSSStyleDeclaration, prefix: string): boolean {
  for (let i = 0; i < style.length; i += 1) {
    const prop = style.item(i);
    if (prop.startsWith(prefix)) return true;
  }
  return false;
}

export function detectFrameworks(doc: Document = document): FrameworkDetection {
  const root = doc.documentElement;
  const style = getComputedStyle(root);

  const hasTailwindVars = hasPropertyPrefix(style, '--tw-');
  const hasTailwindHtmlClass = root.classList.contains('dark') || root.classList.contains('tw');

  const bootstrapVars = style.getPropertyValue('--bs-body-bg') || style.getPropertyValue('--bs-body-color');

  const hasAnyCssVars = (() => {
    for (let i = 0; i < style.length; i += 1) {
      if (style.item(i).startsWith('--')) return true;
    }
    return false;
  })();

  return {
    tailwind: hasTailwindVars || hasTailwindHtmlClass,
    bootstrap: Boolean(bootstrapVars),
    cssVariables: hasAnyCssVars,
  };
}
