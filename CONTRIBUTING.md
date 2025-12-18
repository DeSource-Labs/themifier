# Contributing to Themifier

First off, thank you for considering contributing to Themifier! It's people like you that make open source such a great community. 🎉

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [hello@desource-labs.org](mailto:hello@desource-labs.org).

## 🤝 How Can I Contribute?

### Reporting Issues

Found something that doesn't work as expected? We'd appreciate knowing about it! Before opening an issue, take a quick look at [existing issues](https://github.com/DeSource-Labs/themifier/issues) to see if someone else has already reported it.

When you do report an issue, include:

- **Clear title and description** of what happened
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** (if helpful)
- **Your setup** — OS, browser version, Themifier version
- **Website affected** — include the URL where you noticed the issue

**Example:**

```markdown
## Bug: Dark theme not applying to Google Translate

**Steps:**

1. Install Themifier extension
2. Open Google Translate
3. Select Dark theme from popup
4. Observe buttons remain bright colored

**Expected:** All buttons should be dark themed
**Actual:** Buttons stay in original colors

**Environment:**

- Browser: Chrome 120
- Extension: Themifier v1.0.0
- OS: macOS 14
- Website: https://translate.google.com
```

### Suggesting Ideas

Have an idea for something cool? We'd love to hear it! Feature suggestions are tracked as GitHub issues. When you share your idea, help us understand it by including:

- **What's the idea?** A clear title and description
- **Why would this help?** The real-world use case
- **How would it work?** Your vision for the implementation
- **Which websites?** If applicable, which sites would benefit
- **Show us** Screenshots or examples of similar features elsewhere

### Contributing Code

Ready to help? We appreciate pull requests!

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Ensure your code follows our standards
4. Test thoroughly on multiple websites
5. Submit your pull request and we'll review it

## 🔧 Getting Started

### What You'll Need

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Chrome** >= 120
- **Git** (and familiarity with basic commands)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/themifier.git
cd themifier

# Install dependencies
pnpm install

# Build extension
pnpm build
```

### Development Server

```bash
# Start dev server with hot reload
pnpm dev

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select .output/chrome-mv3 folder
```

### Linting and Formatting

We use ESLint to maintain code quality:

```bash
# Check for lint errors
pnpm lint

# Fix lint errors automatically
pnpm lint:fix
```

**Editor Integration:**

- Install ESLint extension for VS Code
- Enable "Format on Save" in settings
- The project includes `.editorconfig` for consistency

## 📁 Project Structure

```
themifier/
├── .github/                        # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── components/                     # Vue components
│   ├── Badge.vue
│   ├── Card.vue
│   ├── Collapsible.vue
│   ├── ModeItem.vue
│   ├── RefreshButton.vue
│   └── Switch.vue
│
├── composables/                    # Vue 3 composables
│   ├── useExtensionTheme.ts        # Theme injection for extension UI
│   └── useThemifier.ts             # Main extension logic
│
├── entrypoints/                    # Extension entry points
│   ├── background.ts               # Service worker
│   ├── content.ts                  # Content script (injected into pages)
│   ├── popup/                      # Quick access popup
│   │   ├── AppPopup.vue
│   │   ├── main.css
│   │   └── mainPopup.ts
│   └── options/                    # Settings page
│       ├── AppOptions.vue
│       ├── main.css
│       └── mainOptions.ts
│
├── services/                       # Core business logic
│   ├── colorMatrix.ts              # Color matrix calculations
│   ├── colorRegistry.ts            # Color palette registry
│   ├── colorTransform.ts           # Color manipulation
│   ├── cssProcessor.ts             # CSS transformation with contrast checks
│   ├── dynamicThemeEngine.ts       # Core theming logic
│   ├── extensionThemes.ts          # UI theme for popup/options
│   ├── frameworkDetection.ts       # Detect web frameworks
│   ├── palette.ts                  # Color palette utilities
│   ├── storageService.ts           # Chrome storage wrapper
│   ├── themeDetection.ts           # System theme detection
│   └── themeProfiles.ts            # 8 theme definitions
│
├── store/                          # Pinia state management
│   └── settings.ts
│
├── styles/                         # Global styles
│   ├── main.css
│   └── reset.css
│
├── types/                          # TypeScript types
│   ├── messages.ts                 # Message passing types
│   └── theme.ts                    # Theme type definitions
│
├── utils/                          # Helper utilities
│   └── color.ts
│
└── public/                         # Static assets
    └── icon/
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add comments for complex logic
- Update types in `types/theme.ts` if needed

### 3. Test Your Changes

```bash
# Build extension
pnpm build

# Load in Chrome and test on multiple websites:
# - Google Translate
# - Google Search
# - ChatGPT
# - Other content-heavy sites

# Run linting
pnpm lint
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 5. Push and Create PR

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub.

## 📏 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Export types** for public APIs
- **Avoid `any`** — use proper types
- **Document complex types** with JSDoc

**Example:**

```ts
/**
 * Transform CSS color to match theme palette
 */
export function transformCSSColor(value: string, colorType: ColorType, theme: ThemeProfile): string | null {
  // Implementation
}
```

### Vue 3

- **Use Composition API** with `<script setup>`
- **TypeScript** in all components
- **Props interface** for all components
- **Emit types** for all events

**Example:**

```vue
<script setup lang="ts">
interface Props {
  theme: ThemeProfile;
  disabled?: boolean;
}

interface Emits {
  (e: 'theme-change', theme: ThemeProfile): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();
</script>
```

### CSS

- **Use CSS custom properties** for themeable values
- **Mobile-first** responsive design
- **Accessible** — proper contrast, focus states
- **Follow BEM naming** for component styles

```css
.theme-selector {
  background: var(--ext-bg-primary);
  color: var(--ext-text-primary);
  border: 1px solid var(--ext-border-color);
}

.theme-selector:hover {
  background: var(--ext-hover-bg);
}
```

### File Naming

- **Components:** PascalCase (e.g., `ThemeSelector.vue`)
- **Services:** camelCase (e.g., `colorTransform.ts`)
- **Composables:** camelCase with `use` prefix (e.g., `useExtensionTheme.ts`)
- **Types:** PascalCase (e.g., `ThemeProfile.ts`)

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (no logic changes)
- **refactor:** Code refactoring
- **test:** Adding/updating tests
- **chore:** Build process, dependencies, etc.

### Examples

```
feat(colorblind): add deuteranopia color-blind theme

- Implement blue-yellow color axis
- Add to 8 theme collection
- Update theme selector UI

Closes #42
```

```
fix(contrast): validate text/background contrast in CSS processor

When transforming CSS rules with both background and color properties,
now validates the resulting contrast ratio and adjusts if needed.

Fixes #38
```

## 🔗 Pull Request Process

1. **Update documentation** if you're adding new features
2. **Reference issues** in your PR description
3. **Test on multiple websites** before submitting
4. **One feature per PR** — keep PRs focused and reviewable
5. **Be responsive** to feedback and review comments

### PR Title Format

Use the same format as commit messages:

```
feat(popup): add theme preview in dropdown
fix(engine): correct contrast calculation for cyan text
```

---

**Questions?** Open a discussion or ask in your PR!
