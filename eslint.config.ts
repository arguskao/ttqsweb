import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { globalIgnores } from 'eslint/config'
import pluginImport from 'eslint-plugin-import'
import pluginN from 'eslint-plugin-n'
import pluginPromise from 'eslint-plugin-promise'
import pluginSecurity from 'eslint-plugin-security'
import pluginSonarjs from 'eslint-plugin-sonarjs'
import pluginUnusedImports from 'eslint-plugin-unused-imports'
import pluginVue from 'eslint-plugin-vue'

// 自定義規則配置
const customRules = {
  // Vue 相關規則
  'vue/multi-word-component-names': 'error',
  'vue/no-unused-vars': 'error',
  'vue/no-multiple-template-root': 'off', // Vue 3 支持多個根元素
  'vue/no-v-model-argument': 'off', // Vue 3 支持 v-model 參數
  'vue/require-default-prop': 'error',
  'vue/require-prop-types': 'error',
  'vue/component-definition-name-casing': ['error', 'PascalCase'],
  'vue/component-name-in-template-casing': ['error', 'PascalCase'],
  'vue/custom-event-name-casing': ['error', 'camelCase'],
  'vue/define-macros-order': ['error', {
    order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
  }],
  'vue/html-comment-content-spacing': ['error', 'always'],
  'vue/html-comment-indent': ['error', 2],
  'vue/no-duplicate-attributes': 'error',
  'vue/no-empty-component-block': 'error',
  'vue/no-multiple-objects-in-class': 'error',
  'vue/no-static-inline-styles': 'error',
  'vue/no-template-target-blank': 'error',
  'vue/no-useless-mustaches': 'error',
  'vue/no-useless-v-bind': 'error',
  'vue/prefer-separate-static-class': 'error',
  'vue/prefer-true-attribute-shorthand': 'error',
  'vue/require-typed-ref': 'error',
  'vue/v-for-delimiter-style': ['error', 'in'],

  // TypeScript 相關規則
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_'
  }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/no-empty-function': 'error',
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/prefer-function-type': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  '@typescript-eslint/require-array-sort-compare': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/unified-signatures': 'error',

  // 一般 JavaScript 規則
  'no-console': 'warn',
  'no-debugger': 'error',
  'no-alert': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  'template-curly-spacing': ['error', 'never'],
  'object-curly-spacing': ['error', 'always'],
  'array-bracket-spacing': ['error', 'never'],
  'comma-dangle': ['error', 'never'],
  'quotes': ['error', 'single', { avoidEscape: true }],
  'semi': ['error', 'never'],
  'indent': ['error', 2, { SwitchCase: 1 }],
  'no-trailing-spaces': 'error',
  'eol-last': 'error',
  'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
  'no-unused-expressions': 'error',
  'no-unreachable': 'error',
  'no-duplicate-case': 'error',
  'no-empty': 'error',
  'no-extra-semi': 'error',
  'no-func-assign': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-obj-calls': 'error',
  'no-sparse-arrays': 'error',
  'no-unexpected-multiline': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',

  // Import 相關規則
  'import/order': ['error', {
    groups: [
      'builtin',
      'external',
      'internal',
      'parent',
      'sibling',
      'index'
    ],
    'newlines-between': 'always',
    alphabetize: {
      order: 'asc',
      caseInsensitive: true
    }
  }],
  'import/no-unresolved': 'error',
  'import/no-cycle': 'error',
  'import/no-self-import': 'error',
  'import/no-useless-path-segments': 'error',
  'import/no-duplicates': 'error',
  'import/first': 'error',
  'import/newline-after-import': 'error',
  'import/no-default-export': 'off', // Vue 組件需要 default export

  // Unused imports
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['error', {
    vars: 'all',
    varsIgnorePattern: '^_',
    args: 'after-used',
    argsIgnorePattern: '^_'
  }],

  // Security 相關規則
  'security/detect-object-injection': 'warn',
  'security/detect-non-literal-regexp': 'warn',
  'security/detect-unsafe-regex': 'error',
  'security/detect-buffer-noassert': 'error',
  'security/detect-child-process': 'warn',
  'security/detect-disable-mustache-escape': 'error',
  'security/detect-eval-with-expression': 'error',
  'security/detect-no-csrf-before-method-override': 'error',
  'security/detect-non-literal-fs-filename': 'warn',
  'security/detect-non-literal-require': 'warn',
  'security/detect-possible-timing-attacks': 'warn',
  'security/detect-pseudoRandomBytes': 'error',

  // SonarJS 代碼質量規則
  'sonarjs/cognitive-complexity': ['error', 15],
  'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
  'sonarjs/no-duplicated-branches': 'error',
  'sonarjs/no-identical-expressions': 'error',
  'sonarjs/no-redundant-boolean': 'error',
  'sonarjs/no-unused-collection': 'error',
  'sonarjs/no-useless-catch': 'error',
  'sonarjs/prefer-immediate-return': 'error',
  'sonarjs/prefer-object-literal': 'error',
  'sonarjs/prefer-single-boolean-return': 'error',
  'sonarjs/prefer-while': 'error',

  // Promise 相關規則
  'promise/always-return': 'error',
  'promise/no-return-wrap': 'error',
  'promise/param-names': 'error',
  'promise/catch-or-return': 'error',
  'promise/no-nesting': 'warn',
  'promise/no-promise-in-callback': 'warn',
  'promise/no-callback-in-promise': 'warn',
  'promise/avoid-new': 'off',
  'promise/no-new-statics': 'error',
  'promise/no-return-in-finally': 'warn',
  'promise/valid-params': 'warn',

  // Node.js 相關規則
  'n/no-callback-literal': 'error',
  'n/no-exports-assign': 'error',
  'n/no-extraneous-import': 'error',
  'n/no-extraneous-require': 'error',
  'n/no-missing-import': 'error',
  'n/no-missing-require': 'error',
  'n/no-process-exit': 'error',
  'n/no-unpublished-bin': 'error',
  'n/no-unpublished-import': 'error',
  'n/no-unpublished-require': 'error',
  'n/no-unsupported-features/es-builtins': 'error',
  'n/no-unsupported-features/es-syntax': 'error',
  'n/no-unsupported-features/node-builtins': 'error',
  'n/process-exit-as-throw': 'error',
  'n/shebang': 'error'
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  // 添加插件
  {
    plugins: {
      import: pluginImport,
      'unused-imports': pluginUnusedImports,
      security: pluginSecurity,
      sonarjs: pluginSonarjs,
      promise: pluginPromise,
      n: pluginN
    },
    rules: customRules
  },

  // 針對特定文件的規則
  {
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off' // 允許單詞組件名
    }
  },

  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', '**/tests/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off'
    }
  },

  {
    files: ['**/config/**', '**/scripts/**'],
    rules: {
      'no-console': 'off',
      'n/no-process-exit': 'off'
    }
  }
)
