// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '.DS_Store',
    'node_modules',
    'dist',
    'coverage',
    'build',
    'output',
    '.output',
    '.wxt',
    'wxt.config.ts',
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // eslint-plugin-import
  importPlugin.flatConfigs.recommended,
  // TypeScript (syntax + type-aware rules)
  {
    files: ['./**/*.{ts,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': ts.plugin,
    },
    rules: {
      ...ts.configs.recommendedTypeChecked.rules,
      ...ts.configs.stylisticTypeChecked.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/restrict-template-expressions': 'warn',
    },
  },
  {
    rules: {
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],

          pathGroupsExcludedImportTypes: ['type'],

          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        },
      ],
    },
  },
  // eslint-plugin-vue
  vue.configs['flat/recommended'],
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/attribute-hyphenation': ['error', 'never'],
      'vue/v-on-event-hyphenation': ['error', 'never'],
      'vue/no-v-html': 'error',
      'vue/no-multiple-template-root': 'off',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['template', 'script[setup]', 'style[scoped]'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/component-name-in-template-casing': 'error',
      'vue/custom-event-name-casing': 'error',
      'vue/define-emits-declaration': 'error',
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
          defineExposeLast: true,
        },
      ],
      'vue/define-props-declaration': 'error',
      'vue/html-button-has-type': 'error',
      'vue/no-multiple-objects-in-class': 'warn',
      'vue/no-root-v-if': 'error',
      'vue/no-template-target-blank': 'error',
      'vue/no-undef-components': 'off',
      'vue/no-undef-properties': 'warn',
      'vue/no-unused-refs': 'warn',
      'vue/no-use-v-else-with-v-for': 'error',
      'vue/no-useless-mustaches': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'vue/no-v-text': 'error',
      'vue/padding-line-between-blocks': 'warn',
      'vue/prefer-define-options': 'error',
      'vue/prefer-separate-static-class': 'warn',
      'vue/prefer-true-attribute-shorthand': 'warn',
      'vue/require-macro-variable-name': 'error',
      'vue/require-typed-ref': 'warn',
      'vue/v-for-delimiter-style': 'error',
      'vue/valid-define-options': 'error',
      'vue/no-deprecated-slot-attribute': 'off',
    },
  },
  // eslint-plugin-prettier/recommended
  prettier,
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
]);
