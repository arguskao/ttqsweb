# 🎨 CSS 優化指南

## 問題

當前 CSS bundle 大小：**683 KB** (index.css)

主要原因：引入了完整的 Bulma CSS 框架

## 🔍 Bulma 完整版包含什麼？

```css
/* Bulma 包含大量你可能用不到的樣式 */
- 所有顏色變體 (00, 05, 10, 15, ..., 100)
- 所有響應式斷點 (mobile, tablet, desktop, widescreen, fullhd)
- 所有工具類別 (margin, padding, display, flex, etc.)
- 所有元件 (modal, dropdown, tabs, pagination, etc.)
```

---

## 💡 解決方案

### 方案 1：使用 PurgeCSS（最簡單，推薦）

自動移除未使用的 CSS。

#### 安裝
```bash
npm install -D vite-plugin-purgecss
```

#### 配置 vite.config.ts
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { PurgeCSS } from 'vite-plugin-purgecss'

export default defineConfig({
  plugins: [
    vue(),
    PurgeCSS({
      content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}'
      ],
      safelist: [
        // 保留動態類別
        /^is-/,
        /^has-/,
        /^button/,
        /^navbar/,
        /^column/
      ]
    })
  ]
})
```

**預期效果**：CSS 從 683 KB → 50-100 KB

---

### 方案 2：只引入需要的 Bulma 模組

#### 創建 `src/assets/bulma-custom.scss`
```scss
// 基礎
@import 'bulma/sass/utilities/_all';
@import 'bulma/sass/base/_all';

// 元素（按需引入）
@import 'bulma/sass/elements/button';
@import 'bulma/sass/elements/container';
@import 'bulma/sass/elements/title';
@import 'bulma/sass/elements/box';
@import 'bulma/sass/elements/content';
@import 'bulma/sass/elements/tag';

// 表單
@import 'bulma/sass/form/_all';

// 元件（按需引入）
@import 'bulma/sass/components/navbar';
@import 'bulma/sass/components/card';
@import 'bulma/sass/components/message';
@import 'bulma/sass/components/modal';

// 佈局
@import 'bulma/sass/layout/section';
@import 'bulma/sass/layout/footer';
@import 'bulma/sass/grid/columns';
```

#### 修改 `src/assets/main.css`
```css
@import './base.css';
@import './bulma-custom.scss';  /* 改用自定義版本 */
```

**預期效果**：CSS 從 683 KB → 150-250 KB

---

### 方案 3：替換為輕量 CSS 框架

#### 選項 A：Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**優點**：
- 只打包使用的樣式
- 生產環境通常 < 50 KB
- 更現代的開發體驗

**缺點**：
- 需要重寫現有樣式
- 學習曲線

#### 選項 B：Pico CSS
```bash
npm install @picocss/pico
```

```css
@import '@picocss/pico/css/pico.min.css';
```

**優點**：
- 超輕量 (~10 KB)
- 語義化 HTML
- 無需類別名稱

**缺點**：
- 功能較少
- 需要重寫部分 UI

---

## 🚀 立即可做的優化

### 1. 啟用 CSS 壓縮

在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  build: {
    cssMinify: 'lightningcss', // 或 'esbuild'
  },
  css: {
    devSourcemap: false,
    transformer: 'lightningcss', // 更快的 CSS 處理
  }
})
```

### 2. 移除未使用的 Bulma 顏色變體

如果你只用基本顏色，可以自定義 Bulma 變數：

```scss
// bulma-custom.scss
$colors: (
  "primary": ($primary, $primary-invert),
  "link": ($link, $link-invert),
  "info": ($info, $info-invert),
  "success": ($success, $success-invert),
  "warning": ($warning, $warning-invert),
  "danger": ($danger, $danger-invert),
);

// 不生成 00-100 的顏色變體
$shades: ();

@import 'bulma/bulma';
```

---

## 📊 優化效果對比

| 方案 | 當前大小 | 優化後 | 減少 | 難度 |
|------|---------|--------|------|------|
| **PurgeCSS** | 683 KB | 50-100 KB | 85-90% | ⭐ 簡單 |
| **模組化引入** | 683 KB | 150-250 KB | 60-75% | ⭐⭐ 中等 |
| **Tailwind CSS** | 683 KB | 30-50 KB | 90-95% | ⭐⭐⭐ 困難 |
| **Pico CSS** | 683 KB | 10-20 KB | 97% | ⭐⭐⭐⭐ 很困難 |

---

## 🎯 推薦方案

### 短期（立即實施）
1. **安裝 PurgeCSS** - 最快見效
2. **啟用 CSS 壓縮** - 配置簡單

### 中期（逐步優化）
1. **模組化引入 Bulma** - 只引入需要的部分
2. **移除未使用的元件** - 檢查哪些 Bulma 元件沒用到

### 長期（重構考慮）
1. **遷移到 Tailwind CSS** - 更現代、更輕量
2. **自定義 CSS 系統** - 完全控制

---

## 🛠️ 實施步驟

### Step 1: 安裝 PurgeCSS
```bash
npm install -D vite-plugin-purgecss
```

### Step 2: 配置 Vite
```typescript
// vite.config.ts
import { PurgeCSS } from 'vite-plugin-purgecss'

export default defineConfig({
  plugins: [
    vue(),
    PurgeCSS({
      content: ['./index.html', './src/**/*.{vue,js,ts}'],
      safelist: [/^is-/, /^has-/, /^button/, /^navbar/, /^column/]
    })
  ]
})
```

### Step 3: 測試建置
```bash
npm run build
```

### Step 4: 檢查結果
```bash
ls -lh dist/assets/css/
```

---

## 📝 注意事項

### PurgeCSS 可能移除的樣式
- 動態生成的類別名稱
- 通過 JavaScript 添加的類別
- 第三方元件的樣式

### 解決方法
使用 `safelist` 保留必要的樣式：

```typescript
safelist: [
  // Bulma 工具類別
  /^is-/,
  /^has-/,
  
  // 元件類別
  /^button/,
  /^navbar/,
  /^column/,
  /^modal/,
  /^card/,
  
  // 響應式類別
  /-mobile$/,
  /-tablet$/,
  /-desktop$/,
  
  // 動態類別
  'is-active',
  'is-loading',
  'is-danger',
  'is-success'
]
```

---

## 🔍 檢查未使用的 CSS

### 使用 Chrome DevTools
1. 打開 DevTools → Coverage
2. 重新載入頁面
3. 查看未使用的 CSS 百分比

### 使用 PurgeCSS CLI
```bash
npx purgecss --css dist/assets/css/*.css --content dist/**/*.html --output dist/purged/
```

---

## 📚 參考資料

- [Bulma 模組化文檔](https://bulma.io/documentation/customize/with-sass-cli/)
- [PurgeCSS 文檔](https://purgecss.com/)
- [Vite CSS 優化](https://vitejs.dev/guide/features.html#css)
- [Tailwind CSS](https://tailwindcss.com/)

---

**最後更新**: 2025-11-18
**預期改善**: 首次載入時間減少 50-80%
