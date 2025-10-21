// 自定義 ESLint 規則
module.exports = {
  rules: {
    // 禁止使用 console.log（除了在開發環境）
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // 強制使用 const 而不是 let（如果可以的話）
    'prefer-const': 'error',

    // 禁止未使用的變量
    'no-unused-vars': 'error',

    // 強制使用分號
    'semi': ['error', 'never'],

    // 強制使用單引號
    'quotes': ['error', 'single'],

    // 強制使用 2 個空格縮進
    'indent': ['error', 2],

    // 禁止尾隨空格
    'no-trailing-spaces': 'error',

    // 文件末尾必須有空行
    'eol-last': 'error',

    // 禁止多個空行
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

    // Vue 組件必須使用 PascalCase
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // Vue 組件定義必須使用 PascalCase
    'vue/component-definition-name-casing': ['error', 'PascalCase'],

    // 禁止在模板中使用 v-html
    'vue/no-v-html': 'warn',

    // 強制 props 有默認值
    'vue/require-default-prop': 'error',

    // 強制 props 有類型定義
    'vue/require-prop-types': 'error',

    // TypeScript 相關規則
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',

    // Import 順序規則
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

    // 禁止未使用的 imports
    'unused-imports/no-unused-imports': 'error',

    // 安全相關規則
    'security/detect-object-injection': 'warn',
    'security/detect-unsafe-regex': 'error',

    // 代碼質量規則
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
    'sonarjs/no-duplicated-branches': 'error',

    // Promise 相關規則
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/param-names': 'error'
  }
}
