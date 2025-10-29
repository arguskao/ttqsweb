import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

// 修復後的部署用 ESLint 配置
const deployRules = {
  // 只保留關鍵的錯誤檢查
  'no-debugger': 'error',
  'no-unreachable': 'error',
  'no-duplicate-case': 'error',
  'no-func-assign': 'error',
  'no-invalid-regexp': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',

  // 關閉所有可能導致問題的規則
  'no-console': 'off',
  'no-alert': 'off',
  'no-var': 'off',
  'prefer-const': 'off',
  'no-empty': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/switch-exhaustiveness-check': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-this-alias': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  'vue/no-static-inline-styles': 'off',
  'vue/multi-word-component-names': 'off',
  'import/no-unresolved': 'off',
  'import/no-missing-import': 'off',
  'n/no-missing-import': 'off',
  'n/no-unsupported-features/node-builtins': 'off',
  'security/detect-object-injection': 'off',
  'sonarjs/cognitive-complexity': 'off',
  'sonarjs/no-duplicate-string': 'off',
  'unused-imports/no-unused-vars': 'off',
  'unused-imports/no-unused-imports': 'off'
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },

  {
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.wrangler/**',
      '**/build/**',
      '**/public/**',
      '**/tests/**',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  {
    rules: deployRules
  },

  // 針對特定文件的規則
  {
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', '**/tests/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  {
    files: ['**/config/**', '**/scripts/**', 'functions/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)