<div align="center">
  <h1>🎨 Themifier</h1>
  <p><strong>Stunning themes for every website with WCAG accessibility and color-blind support</strong></p>

  <p>
    <a href="https://chrome.google.com/webstore/detail/themifier"><img src="https://img.shields.io/badge/chrome-webstore-blue?logo=googlechrome" alt="Chrome Web Store"></a>
    <a href="https://github.com/DeSource-Labs/themifier/releases"><img src="https://img.shields.io/github/v/release/DeSource-Labs/themifier?color=blue" alt="Latest Release"></a>
    <a href="https://github.com/DeSource-Labs/themifier/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
  </p>

  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-themes">Themes</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

![Themifier Hero](./public/preview.avif)

</div>

---

## 🎯 Why Themifier?

### 🌈 8 Beautifully Crafted Themes

Carefully crafted themes for every preference and accessibility need:

| Theme              | Purpose                   | Key Feature                      |
| ------------------ | ------------------------- | -------------------------------- |
| **Dark**           | Low-light environments    | Comfortable for extended use     |
| **Light**          | Well-lit environments     | Bright background with dark text |
| **High Contrast**  | Maximum accessibility     | 7:1 contrast ratio (WCAG AAA)    |
| **Night Warm**     | Low blue light            | Reduces eye strain               |
| **Protanopia**     | Red-blind accessibility   | Blue-yellow color axis           |
| **Deuteranopia**   | Green-blind accessibility | Blue-yellow color axis           |
| **Tritanopia**     | Blue-blind accessibility  | Red-green color axis             |
| **Reduced Motion** | Vestibular disorders      | Disables animations              |

### 🌐 Built for Everyone

- **WCAG AA compliant** — all themes maintain at least 4.5:1 contrast ratio for readability
- **Color-blind friendly** — dedicated modes for protanopia, deuteranopia, and tritanopia
- **Smart contrast fixing** — automatically adjusts text colors when needed
- **Respects motion preferences** — honors reduced motion settings for accessibility

### 🎯 Your Style, Your Rules

- Choose different themes for different websites
- Override global settings locally when needed
- Quick access theme switcher in the popup

---

## ✨ What Makes Themifier Special

- 🎨 **8 stunning themes** thoughtfully designed for different needs and preferences
- 🔄 **Smart detection** — respects your OS light/dark mode preference
- 🌍 **Universal theming** — works across any website while preserving original design
- ✅ **Readable everywhere** — automatically fixes poor text contrast combinations
- 📊 **Per-site control** — customize your theme preferences for individual websites
- 👁️ **Inclusive color modes** — dedicated support for all types of color blindness
- ⚡ **Real-time switching** — theme changes take effect instantly
- 📱 **Works everywhere** — compatible with any modern website
- 🔧 **Built with TypeScript** — solid, maintainable codebase
- 🎭 **Consistent experience** — extension UI adapts to your selected theme
- 💾 **Efficient** — smart stylesheet processing with minimal overhead

---

## 🎮 Installation

### Chrome Web Store

[Install from Chrome Web Store →](https://chrome.google.com/webstore/detail/themifier)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/DeSource-Labs/themifier.git
cd themifier
```

**Install dependencies:**

```bash
pnpm install
```

**Build the extension:**

```bash
pnpm build
```

**Load in Chrome:**

- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `.output/chrome-mv3` folder

---

## 🛠️ Development

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Chrome** >= 120

### Quick Setup

```bash
# Install dependencies
pnpm install

# Start development with hot reload
pnpm dev

# Build for production
pnpm build

# Check code quality
pnpm lint
```

### Project Structure

```
themifier/
├── .github/                       # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── components/                    # Vue components
│   ├── Badge.vue
│   ├── Card.vue
│   ├── Collapsible.vue
│   ├── ModeItem.vue
│   ├── RefreshButton.vue
│   └── Switch.vue
├── composables/                   # Vue 3 composables
│   ├── useExtensionTheme.ts       # Theme injection for UI
│   └── useThemifier.ts            # Main extension composable
├── entrypoints/                   # Extension entry points
│   ├── background.ts              # Service worker
│   ├── content.ts                 # Content script (injected into pages)
│   ├── popup/                     # Quick access popup
│   │   ├── AppPopup.vue
│   │   ├── main.css
│   │   └── mainPopup.ts
│   └── options/                   # Settings page
│       ├── AppOptions.vue
│       ├── main.css
│       └── mainOptions.ts
├── services/                      # Core business logic
│   ├── colorMatrix.ts             # Color matrix calculations
│   ├── colorRegistry.ts           # Color palette registry
│   ├── colorTransform.ts          # Color manipulation utilities
│   ├── cssProcessor.ts            # CSS transformation with contrast checks
│   ├── dynamicThemeEngine.ts      # Main theming engine
│   ├── extensionThemes.ts         # UI theme for popup/options
│   ├── frameworkDetection.ts      # Detect web frameworks
│   ├── palette.ts                 # Color palette utilities
│   ├── storageService.ts          # Chrome storage wrapper
│   ├── themeDetection.ts          # System theme detection
│   └── themeProfiles.ts           # Theme definitions (8 themes)
├── store/                         # Pinia state management
│   └── settings.ts
├── styles/                        # Global styles
│   ├── main.css
│   └── reset.css
├── types/                         # TypeScript types
│   ├── messages.ts                # Message types for communication
│   └── theme.ts                   # Theme type definitions
├── utils/                         # Helper utilities
│   └── color.ts
└── public/                        # Static assets
    └── icon/
```

---

## 🤝 Join the Community

We'd love your contributions! Check out our [Contributing Guide](./CONTRIBUTING.md) for everything you need to know.

### Start Contributing

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/themifier.git`
3. **Install** dependencies: `pnpm install`
4. **Create** a branch: `git checkout -b feature/my-feature`
5. **Make** your changes
6. **Build** and test: `pnpm build`
7. **Commit**: `git commit -m "feat: add awesome feature"`
8. **Push**: `git push origin feature/my-feature`
9. **Open** a Pull Request

---

## 🌟 Sponsors

Developed and maintained by [DeSource Labs](https://github.com/DeSource-Labs).

<div align="center">
  <a href="https://github.com/DeSource-Labs">
    <img src="https://github.com/DeSource-Labs.png?size=100" width="50" height="50" alt="DeSource Labs">
  </a>
</div>

**Created by [Stefan Popov](https://github.com/stefashkaa)**

---

## 📄 License

[MIT](./LICENSE) © 2025 DeSource Labs

---

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore/detail/themifier)
- [GitHub Repository](https://github.com/DeSource-Labs/themifier)
- [Issue Tracker](https://github.com/DeSource-Labs/themifier/issues)
- [Discussions](https://github.com/DeSource-Labs/themifier/discussions)

---

<div align="center">
  <sub>Built with ❤️ by the DeSource Labs team</sub>
</div>
