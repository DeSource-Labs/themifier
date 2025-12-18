import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: ['<all_urls>', 'http://localhost/*'],
    offline_enabled: true,
    short_name: 'Themifier',
    name: 'Themifier - Custom Themes for Websites',
  },
  // ensure open_in_tab is set on the final manifest
  hooks: {
    'build:manifestGenerated'(wxt, manifest) {
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
});
