import js from '@eslint/js'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

const determinism = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message: 'Use useClock() de @/composables/clock — veja CLAUDE.md, regra 2.',
    },
    {
      selector: "MemberExpression[object.name='Date'][property.name='now']",
      message: 'Use useClock() de @/composables/clock — veja CLAUDE.md, regra 2.',
    },
    {
      selector: "MemberExpression[object.name='Math'][property.name='random']",
      message: 'Ids vêm da API. Nada é aleatório no cliente — veja CLAUDE.md, regra 2.',
    },
  ],
}
export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'public/**', 'node_modules/**'] },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      ...determinism,
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'test/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', fetch: 'readonly', setTimeout: 'readonly', Buffer: 'readonly' },
    },
    rules: { 'no-restricted-syntax': 'off' },
  },
)