// @ts-check
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import nounsanitized from 'eslint-plugin-no-unsanitized';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Regla de dependencia (overview.md): solo la fábrica conoce los adaptadores del formulario.
const ADAPTER_IMPORT = {
  group: ['**/lib/form/adapters/*', '**/form/adapters/*', './adapters/*'],
  message:
    'Usa createSubmitter() de lib/form/factory; los adaptadores no se importan directamente.',
};

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'node_modules/',
      'tests/fixtures/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  nounsanitized.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'import-x': importX },
    settings: {
      // Sin esto import-x no puede leer los .ts importados y no-cycle no detecta nada.
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts'] },
      'import-x/resolver-next': [
        createNodeResolver({ extensions: ['.ts', '.mjs', '.js', '.astro', '.json'] }),
      ],
    },
    rules: {
      'import-x/no-cycle': 'error',
    },
  },
  {
    files: ['src/**'],
    rules: {
      'no-console': 'error',
      'no-restricted-imports': ['error', { patterns: [ADAPTER_IMPORT] }],
    },
  },
  {
    files: ['src/lib/form/factory.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  eslintConfigPrettier,
];
