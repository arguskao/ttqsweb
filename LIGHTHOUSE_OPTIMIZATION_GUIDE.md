# Lighthouse 分數優化指南

> **專案**: 藥助Next學院  
> **生成日期**: 2025-11-20  
> **目標**: 達到 Lighthouse 90+ 分數（Performance, Accessibility, Best Practices, SEO）

---

## 📊 目錄

- [Lighthouse 四大評分項目](#lighthouse-四大評分項目)
- [當前狀況分析](#-當前狀況分析)
- [Performance 優化（性能）](#-performance-優化性能)
- [Accessibility 優化（無障礙）](#-accessibility-優化無障礙)
- [Best Practices 優化（最佳實踐）](#-best-practices-優化最佳實踐)
- [SEO 優化（搜尋引擎優化）](#-seo-優化搜尋引擎優化)
- [快速檢查清單](#-快速檢查清單)
- [測試與驗證](#-測試與驗證)

---

## Lighthouse 四大評分項目

| 項目 | 權重 | 主要影響因素 | 目標分數 |
|------|------|------------|----------|
| 🚀 **Performance** | 高 | FCP, LCP, TBT, CLS, SI | 90+ |
| ♿ **Accessibility** | 高 | ARIA, 對比度, 語義化 | 95+ |
| ✅ **Best Practices** | 中 | HTTPS, Console 錯誤, 安全性 | 95+ |
| 🔍 **SEO** | 中 | Meta 標籤, 結構化數據, 可爬性 | 95+ |

---

## 🔍 當前狀況分析

### ✅ 已實施的優化

根據您的代碼，已經做了以下優化：

1. **HTML 優化**
   - ✅ 完整的 Meta 標籤（SEO）
   - ✅ Open Graph 和 Twitter Card
   - ✅ Structured Data (JSON-LD)
   - ✅ Preconnect 和 DNS Prefetch
   - ✅ Font 預加載

2. **Vite 配置優化**
   - ✅ Code Splitting（manualChunks）
   - ✅ 資源分類（images, fonts, css）
   - ✅ 依賴優化（optimizeDeps）

3. **PWA 支持**
   - ✅ Service Worker (`sw.js`)
   - ✅ Web Manifest (`site.webmanifest`)

### ⚠️ 需要改進的項目

1. **Performance 問題**
   - ❌ Google Fonts 阻塞渲染
   - ❌ FontAwesome CDN 過大
   - ❌ Google Analytics 同步加載
   - ❌ 缺少圖片優化策略

2. **Accessibility 問題**
   - ❌ 可能缺少 ARIA 標籤
   - ❌ 顏色對比度需檢查
   - ❌ 表單標籤可能不完整

3. **Best Practices 問題**
   - ❌ 外部資源缺少 SRI（Subresource Integrity）
   - ❌ Console.log 可能在生產環境中存在

---

## 🚀 Performance 優化（性能）

### 核心 Web Vitals 指標

| 指標 | 說明 | 目標值 | 優化重點 |
|------|------|--------|----------|
| **LCP** | Largest Contentful Paint | < 2.5s | 圖片優化、字體加載 |
| **FID** | First Input Delay | < 100ms | JavaScript 優化 |
| **CLS** | Cumulative Layout Shift | < 0.1 | 預留空間、字體顯示 |
| **FCP** | First Contentful Paint | < 1.8s | 關鍵資源優化 |
| **TBT** | Total Blocking Time | < 200ms | 減少 JS 執行時間 |

---

### 優化 1：字體加載優化

#### 問題：Google Fonts 阻塞渲染

**當前代碼** (`index.html` 第 46-51 行):
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
  as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**問題**:
- 仍需要下載外部 CSS
- 會產生額外的 HTTP 請求
- 可能導致 FOIT (Flash of Invisible Text)

**優化方案 1：自托管字體（推薦）**

1. 下載字體文件到本地：
```bash
# 使用 google-webfonts-helper
# https://gwfh.mranftl.com/fonts/noto-sans-tc
```

2. 將字體放到 `public/fonts/` 目錄

3. 在 `src/assets/main.css` 中定義：
```css
/* 自托管 Noto Sans TC */
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* 重要：避免 FOIT */
  src: url('/fonts/noto-sans-tc-v400-chinese-traditional-regular.woff2') format('woff2');
  unicode-range: U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF; /* 中文字符範圍 */
}

@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/noto-sans-tc-v400-chinese-traditional-700.woff2') format('woff2');
  unicode-range: U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF;
}
```

4. 在 `index.html` 中預加載：
```html
<!-- 預加載關鍵字體 -->
<link rel="preload" href="/fonts/noto-sans-tc-v400-chinese-traditional-regular.woff2" 
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-tc-v400-chinese-traditional-700.woff2" 
      as="font" type="font/woff2" crossorigin>
```

5. 移除 Google Fonts CDN：
```html
<!-- 刪除這些行 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
  as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**預期效果**:
- 減少 DNS 查詢和 HTTP 請求
- LCP 改善 200-500ms
- 完全控制字體加載行為

---

**優化方案 2：使用 Variable Font（進階）**

```css
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 100 900; /* 支持所有字重 */
  font-display: swap;
  src: url('/fonts/noto-sans-tc-variable.woff2') format('woff2-variations');
}
```

**優點**:
- 單一文件支持多個字重
- 文件大小更小
- 更流暢的字重過渡

---

### 優化 2：FontAwesome 優化

#### 問題：完整的 FontAwesome CDN 過大

**當前代碼** (`index.html` 第 57-58 行):
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  crossorigin="anonymous">
```

**問題**:
- 完整版本約 70KB (gzipped)
- 包含大量未使用的圖標
- 阻塞渲染

**優化方案 1：只加載需要的圖標（推薦）**

1. 安裝 FontAwesome：
```bash
npm install @fortawesome/fontawesome-svg-core
npm install @fortawesome/free-solid-svg-icons
npm install @fortawesome/vue-fontawesome@latest-3
```

2. 在 `src/main.ts` 中按需導入：
```typescript
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// 只導入需要的圖標
import { 
  faUser, 
  faBook, 
  faGraduationCap,
  faBriefcase,
  faChartLine
} from '@fortawesome/free-solid-svg-icons'

// 添加到庫
library.add(faUser, faBook, faGraduationCap, faBriefcase, faChartLine)

// 註冊組件
app.component('font-awesome-icon', FontAwesomeIcon)
```

3. 在組件中使用：
```vue
<template>
  <font-awesome-icon icon="user" />
</template>
```

4. 移除 CDN 引用：
```html
<!-- 刪除這行 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

**預期效果**:
- Bundle 大小減少 50-80KB
- 消除渲染阻塞
- FCP 改善 100-300ms

---

**優化方案 2：使用 SVG 圖標（最佳性能）**

使用 [Iconify](https://iconify.design/) 或自定義 SVG：

```bash
npm install @iconify/vue
```

```vue
<template>
  <Icon icon="mdi:account" />
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
```

---

### 優化 3：Google Analytics 異步加載

#### 問題：GA 同步加載阻塞解析

**當前代碼** (`index.html` 第 94-102 行):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-W2Z34W0EYK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-W2Z34W0EYK');
</script>
```

**優化方案：延遲加載 GA**

1. 移除 `index.html` 中的 GA 代碼

2. 在 `src/utils/analytics.ts` 中動態加載：
```typescript
export class Analytics {
  private initialized = false

  async init() {
    if (this.initialized || !import.meta.env.VITE_GA_TRACKING_ID) {
      return
    }

    // 延遲加載 GA，避免阻塞初始渲染
    await this.loadGoogleAnalytics()
    this.initialized = true
  }

  private async loadGoogleAnalytics() {
    return new Promise<void>((resolve) => {
      // 創建 script 標籤
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_TRACKING_ID}`
      
      script.onload = () => {
        // 初始化 gtag
        window.dataLayer = window.dataLayer || []
        function gtag(...args: any[]) {
          window.dataLayer.push(args)
        }
        window.gtag = gtag
        
        gtag('js', new Date())
        gtag('config', import.meta.env.VITE_GA_TRACKING_ID)
        
        resolve()
      }
      
      document.head.appendChild(script)
    })
  }
}
```

3. 在 `src/main.ts` 中延遲初始化：
```typescript
// 在應用掛載後再初始化 analytics
app.mount('#app')

// 使用 requestIdleCallback 在瀏覽器空閒時初始化
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    if (import.meta.env.VITE_GA_TRACKING_ID) {
      analytics.init()
    }
  })
} else {
  // 降級方案
  setTimeout(() => {
    if (import.meta.env.VITE_GA_TRACKING_ID) {
      analytics.init()
    }
  }, 2000)
}
```

**預期效果**:
- TBT 減少 50-100ms
- FCP 改善 100-200ms
- 不影響分析數據收集

---

### 優化 4：圖片優化

#### 實施現代圖片格式

**創建 `vite-plugin-imagemin` 配置**:

1. 安裝插件：
```bash
npm install vite-plugin-imagemin -D
```

2. 更新 `vite.config.ts`：
```typescript
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false
      },
      optipng: {
        optimizationLevel: 7
      },
      mozjpeg: {
        quality: 80
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false
          },
          {
            name: 'removeEmptyAttrs',
            active: true
          }
        ]
      }
    })
  ]
})
```

#### 使用 WebP 格式

**創建圖片組件** `src/components/common/OptimizedImage.vue`:
```vue
<template>
  <picture>
    <source :srcset="webpSrc" type="image/webp">
    <source :srcset="src" :type="imageType">
    <img 
      :src="src" 
      :alt="alt" 
      :loading="loading"
      :width="width"
      :height="height"
      :class="className"
    >
  </picture>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  loading?: 'lazy' | 'eager'
  width?: number
  height?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy'
})

const webpSrc = computed(() => {
  return props.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
})

const imageType = computed(() => {
  const ext = props.src.split('.').pop()?.toLowerCase()
  return `image/${ext}`
})
</script>
```

**使用方式**:
```vue
<OptimizedImage 
  src="/images/hero-banner.jpg"
  alt="藥助Next學院"
  width="1200"
  height="600"
  loading="eager"
/>
```

**重要：設置圖片尺寸**
```vue
<!-- ❌ 錯誤：會導致 CLS -->
<img src="/image.jpg" alt="...">

<!-- ✅ 正確：預留空間，避免 CLS -->
<img src="/image.jpg" alt="..." width="800" height="600">
```

---

### 優化 5：代碼分割優化

#### 改進 Vite 配置的 manualChunks

**當前配置**已經不錯，但可以進一步優化：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 第三方庫
          if (id.includes('node_modules')) {
            // Vue 核心
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue'
            }
            
            // UI 庫
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'vendor-ui'
            }
            
            // 工具庫
            if (id.includes('axios') || id.includes('lodash') || id.includes('dayjs')) {
              return 'vendor-utils'
            }
            
            // 其他第三方庫
            return 'vendor-other'
          }
          
          // 按路由分割
          if (id.includes('/views/admin/')) {
            return 'route-admin'
          }
          if (id.includes('/views/auth/')) {
            return 'route-auth'
          }
          if (id.includes('/views/courses/')) {
            return 'route-courses'
          }
          if (id.includes('/views/instructor/')) {
            return 'route-instructors'
          }
          if (id.includes('/views/jobs/')) {
            return 'route-jobs'
          }
        }
      }
    }
  }
})
```

---

### 優化 6：移除生產環境的 Console.log

**創建 Vite 插件** `vite-plugin-remove-console.ts`:

```typescript
import type { Plugin } from 'vite'

export function removeConsolePlugin(): Plugin {
  return {
    name: 'remove-console',
    transform(code, id) {
      if (id.endsWith('.ts') || id.endsWith('.vue')) {
        // 移除 console.log, console.warn, console.error
        return {
          code: code.replace(/console\.(log|warn|error)\(.*?\);?/g, ''),
          map: null
        }
      }
    }
  }
}
```

**在 `vite.config.ts` 中使用**:
```typescript
import { removeConsolePlugin } from './vite-plugin-remove-console'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 只在生產環境移除 console
    ...(process.env.NODE_ENV === 'production' ? [removeConsolePlugin()] : [])
  ]
})
```

**或使用 esbuild 配置**:
```typescript
export default defineConfig({
  build: {
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})
```

---

### 優化 7：預加載關鍵資源

**在 `index.html` 中添加**:
```html
<head>
  <!-- 預加載關鍵 CSS -->
  <link rel="preload" href="/src/assets/main.css" as="style">
  
  <!-- 預加載關鍵 JavaScript -->
  <link rel="modulepreload" href="/src/main.ts">
  
  <!-- 預加載 Logo（LCP 元素） -->
  <link rel="preload" href="/logo.svg" as="image">
  
  <!-- 預加載首屏圖片 -->
  <link rel="preload" href="/images/hero-banner.webp" as="image" type="image/webp">
</head>
```

---

### 優化 8：使用 Resource Hints

**更新 `index.html`**:
```html
<!-- DNS Prefetch：提前解析域名 -->
<link rel="dns-prefetch" href="//api.pharmacy-academy.com">
<link rel="dns-prefetch" href="//www.googletagmanager.com">

<!-- Preconnect：提前建立連接（更積極） -->
<link rel="preconnect" href="https://api.pharmacy-academy.com">

<!-- Prefetch：預取下一頁可能需要的資源 -->
<link rel="prefetch" href="/assets/route-courses.js">
```

---

## ♿ Accessibility 優化（無障礙）

### 優化 1：語義化 HTML

**確保使用正確的 HTML 標籤**:

```vue
<!-- ❌ 錯誤 -->
<div class="button" @click="submit">提交</div>

<!-- ✅ 正確 -->
<button type="submit" @click="submit">提交</button>

<!-- ❌ 錯誤 -->
<div class="heading">課程列表</div>

<!-- ✅ 正確 -->
<h2>課程列表</h2>
```

---

### 優化 2：ARIA 標籤

**為互動元素添加 ARIA 標籤**:

```vue
<template>
  <!-- 導航 -->
  <nav aria-label="主導航">
    <ul>
      <li><a href="/">首頁</a></li>
      <li><a href="/courses">課程</a></li>
    </ul>
  </nav>
  
  <!-- 搜尋表單 -->
  <form role="search" aria-label="搜尋課程">
    <input 
      type="search" 
      aria-label="搜尋關鍵字"
      placeholder="搜尋課程..."
    >
    <button type="submit" aria-label="執行搜尋">
      <i class="fa fa-search" aria-hidden="true"></i>
    </button>
  </form>
  
  <!-- 載入狀態 -->
  <div v-if="loading" role="status" aria-live="polite">
    載入中...
  </div>
  
  <!-- 錯誤訊息 -->
  <div v-if="error" role="alert" aria-live="assertive">
    {{ error }}
  </div>
  
  <!-- 模態框 -->
  <div 
    v-if="showModal" 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <h2 id="modal-title">確認刪除</h2>
    <!-- ... -->
  </div>
</template>
```

---

### 優化 3：鍵盤導航

**確保所有互動元素可用鍵盤操作**:

```vue
<template>
  <!-- 自定義下拉選單 -->
  <div 
    class="dropdown"
    @keydown.escape="closeDropdown"
    @keydown.enter="selectOption"
    @keydown.arrow-down="nextOption"
    @keydown.arrow-up="prevOption"
  >
    <button 
      @click="toggleDropdown"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      {{ selectedOption }}
    </button>
    
    <ul v-if="isOpen" role="listbox">
      <li 
        v-for="option in options"
        :key="option.id"
        role="option"
        :aria-selected="option.id === selectedId"
        tabindex="0"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>
```

---

### 優化 4：顏色對比度

**確保文字與背景對比度符合 WCAG AA 標準**:

- 正常文字：至少 4.5:1
- 大文字（18pt+ 或 14pt+ 粗體）：至少 3:1

**使用工具檢查**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Lighthouse

**CSS 示例**:
```css
/* ❌ 對比度不足 */
.text {
  color: #999;
  background: #fff;
  /* 對比度 2.85:1 - 不符合標準 */
}

/* ✅ 對比度充足 */
.text {
  color: #666;
  background: #fff;
  /* 對比度 5.74:1 - 符合 AA 標準 */
}
```

---

### 優化 5：表單標籤

**確保所有表單元素都有標籤**:

```vue
<template>
  <!-- ❌ 錯誤：缺少 label -->
  <input type="text" placeholder="姓名">
  
  <!-- ✅ 正確：使用 label -->
  <label for="name">姓名</label>
  <input id="name" type="text" placeholder="請輸入姓名">
  
  <!-- ✅ 正確：使用 aria-label -->
  <input 
    type="text" 
    aria-label="姓名"
    placeholder="請輸入姓名"
  >
  
  <!-- ✅ 正確：使用 aria-labelledby -->
  <span id="name-label">姓名</span>
  <input 
    type="text" 
    aria-labelledby="name-label"
    placeholder="請輸入姓名"
  >
</template>
```

---

### 優化 6：焦點管理

**為焦點元素添加明顯的視覺指示**:

```css
/* 不要移除焦點輪廓 */
/* ❌ 錯誤 */
* {
  outline: none;
}

/* ✅ 正確：自定義焦點樣式 */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #00d1b2;
  outline-offset: 2px;
}

/* 移除滑鼠點擊時的焦點輪廓 */
button:focus:not(:focus-visible) {
  outline: none;
}
```

---

### 優化 7：圖片 Alt 文字

**為所有圖片提供有意義的 alt 文字**:

```vue
<template>
  <!-- ❌ 錯誤：缺少 alt -->
  <img src="/course.jpg">
  
  <!-- ❌ 錯誤：無意義的 alt -->
  <img src="/course.jpg" alt="圖片">
  
  <!-- ✅ 正確：描述性 alt -->
  <img src="/course.jpg" alt="藥局助理基礎課程封面">
  
  <!-- ✅ 正確：裝飾性圖片使用空 alt -->
  <img src="/decoration.svg" alt="" aria-hidden="true">
</template>
```

---

## ✅ Best Practices 優化（最佳實踐）

### 優化 1：添加 Subresource Integrity (SRI)

**為外部資源添加 SRI 哈希**:

```html
<!-- 使用 SRI 保護外部資源 -->
<link 
  rel="stylesheet" 
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
>
```

**生成 SRI 哈希**:
```bash
# 使用 openssl
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

或使用線上工具：[SRI Hash Generator](https://www.srihash.org/)

---

### 優化 2：HTTPS 和安全標頭

**在 `public/_headers` 中添加安全標頭**:

```
/*
  # 安全標頭
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  
  # CSP (Content Security Policy)
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.pharmacy-academy.com
  
  # HSTS (HTTP Strict Transport Security)
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  
  # 緩存控制
  Cache-Control: public, max-age=31536000, immutable

# HTML 文件不緩存
/*.html
  Cache-Control: no-cache, no-store, must-revalidate

# Service Worker 不緩存
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
```

---

### 優化 3：移除未使用的代碼

**使用 PurgeCSS 移除未使用的 CSS**:

1. 安裝：
```bash
npm install @fullhuman/postcss-purgecss -D
```

2. 創建 `postcss.config.js`:
```javascript
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}'
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: ['html', 'body'],
        deep: [/^router-/, /^transition-/],
        greedy: [/^el-/] // 保留 Element Plus 類名
      }
    })
  ]
}
```

---

### 優化 4：使用現代 JavaScript

**在 `vite.config.ts` 中設置目標**:

```typescript
export default defineConfig({
  build: {
    target: 'es2020', // 或 'esnext'
    cssTarget: 'chrome90'
  }
})
```

---

### 優化 5：錯誤處理

**全局錯誤處理**:

```typescript
// src/main.ts
app.config.errorHandler = (err, instance, info) => {
  // 只在開發環境記錄到 console
  if (import.meta.env.DEV) {
    console.error('Vue Error:', err)
    console.error('Component:', instance)
    console.error('Info:', info)
  }
  
  // 生產環境發送到錯誤追蹤服務
  if (import.meta.env.PROD) {
    // 例如：Sentry.captureException(err)
  }
}

// 處理未捕獲的 Promise 錯誤
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('Unhandled Promise Rejection:', event.reason)
  }
  
  if (import.meta.env.PROD) {
    // 發送到錯誤追蹤服務
  }
})
```

---

## 🔍 SEO 優化（搜尋引擎優化）

### 優化 1：Meta 標籤優化

**您的 `index.html` 已經做得很好！** 但可以進一步優化：

```html
<head>
  <!-- 基本 Meta 標籤 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- 標題（50-60 字符） -->
  <title>藥助Next學院 - 專業藥局助理轉職教育與就業媒合平台</title>
  
  <!-- 描述（150-160 字符） -->
  <meta name="description" content="藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務，幫助您成功進入醫藥產業。立即報名，開啟您的藥學職涯！">
  
  <!-- 關鍵字（可選，現代 SEO 影響較小） -->
  <meta name="keywords" content="藥局助理,轉職訓練,醫藥教育,就業媒合,藥學課程,職能訓練,實習機會,藥師助理,藥局工作">
  
  <!-- 作者 -->
  <meta name="author" content="藥助Next學院">
  
  <!-- 機器人指令 -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://pharmacy-academy.com/">
  
  <!-- 語言 -->
  <meta http-equiv="content-language" content="zh-TW">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://pharmacy-academy.com/">
  <meta property="og:title" content="藥助Next學院 - 專業藥局助理轉職教育與就業媒合平台">
  <meta property="og:description" content="藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務。">
  <meta property="og:image" content="https://pharmacy-academy.com/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:site_name" content="藥助Next學院">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="藥助Next學院 - 專業藥局助理轉職教育與就業媒合平台">
  <meta name="twitter:description" content="藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務。">
  <meta name="twitter:image" content="https://pharmacy-academy.com/og-image.jpg">
</head>
```

---

### 優化 2：結構化數據（Schema.org）

**擴展您的 JSON-LD**:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://pharmacy-academy.com/#organization",
      "name": "藥助Next學院",
      "description": "專業藥局助理轉職教育與就業媒合平台",
      "url": "https://pharmacy-academy.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pharmacy-academy.com/logo.svg",
        "width": 512,
        "height": 512
      },
      "image": "https://pharmacy-academy.com/og-image.jpg",
      "telephone": "+886-xxx-xxx-xxx",
      "email": "info@pharmacy-academy.com",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "TW",
        "addressRegion": "台北市",
        "addressLocality": "台北市",
        "streetAddress": "xxx路xxx號"
      },
      "sameAs": [
        "https://www.facebook.com/pharmacy-academy",
        "https://www.linkedin.com/company/pharmacy-academy",
        "https://www.instagram.com/pharmacy-academy"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+886-xxx-xxx-xxx",
        "contactType": "customer service",
        "availableLanguage": ["Chinese", "zh-TW"],
        "areaServed": "TW"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://pharmacy-academy.com/#website",
      "url": "https://pharmacy-academy.com",
      "name": "藥助Next學院",
      "publisher": {
        "@id": "https://pharmacy-academy.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://pharmacy-academy.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://pharmacy-academy.com/#webpage",
      "url": "https://pharmacy-academy.com",
      "name": "藥助Next學院 - 首頁",
      "isPartOf": {
        "@id": "https://pharmacy-academy.com/#website"
      },
      "about": {
        "@id": "https://pharmacy-academy.com/#organization"
      },
      "description": "藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務。"
    }
  ]
}
</script>
```

**為課程頁面添加 Course Schema**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "藥局助理基礎課程",
  "description": "學習藥局助理的基本知識與技能",
  "provider": {
    "@type": "Organization",
    "name": "藥助Next學院",
    "url": "https://pharmacy-academy.com"
  },
  "offers": {
    "@type": "Offer",
    "category": "Paid",
    "price": "15000",
    "priceCurrency": "TWD"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "duration": "P3M",
    "instructor": {
      "@type": "Person",
      "name": "講師姓名"
    }
  }
}
</script>
```

---

### 優化 3：Sitemap 和 Robots.txt

**確保 `public/sitemap.xml` 是最新的**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- 首頁 -->
  <url>
    <loc>https://pharmacy-academy.com/</loc>
    <lastmod>2025-11-20</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 課程列表 -->
  <url>
    <loc>https://pharmacy-academy.com/courses</loc>
    <lastmod>2025-11-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- 其他頁面... -->
  
</urlset>
```

**優化 `public/robots.txt`**:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Sitemap
Sitemap: https://pharmacy-academy.com/sitemap.xml

# 爬蟲速率限制
Crawl-delay: 1
```

---

### 優化 4：語義化 HTML 結構

**使用正確的 HTML5 語義標籤**:

```vue
<template>
  <div id="app">
    <!-- 頁首 -->
    <header>
      <nav aria-label="主導航">
        <!-- 導航內容 -->
      </nav>
    </header>
    
    <!-- 主要內容 -->
    <main>
      <!-- 文章 -->
      <article>
        <header>
          <h1>文章標題</h1>
          <p>
            <time datetime="2025-11-20">2025年11月20日</time>
          </p>
        </header>
        
        <section>
          <h2>章節標題</h2>
          <!-- 內容 -->
        </section>
      </article>
      
      <!-- 側邊欄 -->
      <aside>
        <!-- 相關內容 -->
      </aside>
    </main>
    
    <!-- 頁尾 -->
    <footer>
      <!-- 頁尾內容 -->
    </footer>
  </div>
</template>
```

---

### 優化 5：內部連結優化

**使用描述性的錨文字**:

```vue
<!-- ❌ 錯誤：無意義的錨文字 -->
<a href="/courses">點擊這裡</a>

<!-- ✅ 正確：描述性錨文字 -->
<a href="/courses">瀏覽所有藥局助理課程</a>

<!-- ❌ 錯誤：URL 作為錨文字 -->
<a href="https://pharmacy-academy.com/courses">https://pharmacy-academy.com/courses</a>

<!-- ✅ 正確：有意義的文字 -->
<a href="https://pharmacy-academy.com/courses">藥助Next學院課程列表</a>
```

---

### 優化 6：移動端優化

**確保移動端友好**:

```html
<!-- Viewport 設置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">

<!-- 移動端主題色 -->
<meta name="theme-color" content="#00d1b2">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

**CSS 響應式設計**:
```css
/* 移動優先 */
.container {
  padding: 1rem;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

---

## ✅ 快速檢查清單

### Performance 檢查清單

- [ ] 字體已自托管或使用 `font-display: swap`
- [ ] 圖片使用 WebP 格式
- [ ] 圖片設置了 `width` 和 `height` 屬性
- [ ] 圖片使用 `loading="lazy"`（非首屏）
- [ ] 關鍵資源使用 `preload`
- [ ] 第三方腳本使用 `async` 或 `defer`
- [ ] 實施了代碼分割
- [ ] 移除了未使用的 CSS 和 JavaScript
- [ ] 啟用了 Gzip/Brotli 壓縮
- [ ] 設置了適當的緩存策略

### Accessibility 檢查清單

- [ ] 所有圖片都有 `alt` 屬性
- [ ] 表單元素都有 `label`
- [ ] 使用語義化 HTML 標籤
- [ ] 顏色對比度符合 WCAG AA 標準
- [ ] 可以完全使用鍵盤導航
- [ ] 焦點狀態清晰可見
- [ ] 使用了適當的 ARIA 標籤
- [ ] 動態內容使用 `aria-live`

### Best Practices 檢查清單

- [ ] 使用 HTTPS
- [ ] 外部資源使用 SRI
- [ ] 設置了安全標頭
- [ ] 沒有 console 錯誤
- [ ] 使用現代 JavaScript (ES6+)
- [ ] 圖片使用適當的格式和尺寸
- [ ] 避免使用已棄用的 API

### SEO 檢查清單

- [ ] 每個頁面都有唯一的 `<title>`
- [ ] 每個頁面都有唯一的 `<meta description>`
- [ ] 使用了結構化數據 (JSON-LD)
- [ ] 有 `sitemap.xml`
- [ ] 有 `robots.txt`
- [ ] 使用了語義化 HTML
- [ ] 內部連結使用描述性錨文字
- [ ] 移動端友好
- [ ] 頁面加載速度快

---

## 🧪 測試與驗證

### 1. 使用 Lighthouse

**Chrome DevTools**:
1. 打開 Chrome DevTools (F12)
2. 切換到 "Lighthouse" 標籤
3. 選擇設備類型（Mobile/Desktop）
4. 選擇類別（Performance, Accessibility, Best Practices, SEO）
5. 點擊 "Analyze page load"

**命令行**:
```bash
# 安裝 Lighthouse CLI
npm install -g lighthouse

# 運行測試
lighthouse https://pharmacy-academy.com --output html --output-path ./lighthouse-report.html

# 只測試性能
lighthouse https://pharmacy-academy.com --only-categories=performance

# 模擬移動設備
lighthouse https://pharmacy-academy.com --preset=mobile

# 模擬慢速網絡
lighthouse https://pharmacy-academy.com --throttling-method=devtools
```

---

### 2. 使用 PageSpeed Insights

訪問 [PageSpeed Insights](https://pagespeed.web.dev/) 並輸入您的網址。

---

### 3. 使用 WebPageTest

訪問 [WebPageTest](https://www.webpagetest.org/) 進行更詳細的性能測試。

---

### 4. 本地測試腳本

**創建 `scripts/lighthouse-test.js`**:

```javascript
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  }
  
  const runnerResult = await lighthouse(url, options)
  
  // 保存報告
  const reportHtml = runnerResult.report
  fs.writeFileSync('lighthouse-report.html', reportHtml)
  
  // 輸出分數
  console.log('Lighthouse Scores:')
  console.log('Performance:', runnerResult.lhr.categories.performance.score * 100)
  console.log('Accessibility:', runnerResult.lhr.categories.accessibility.score * 100)
  console.log('Best Practices:', runnerResult.lhr.categories['best-practices'].score * 100)
  console.log('SEO:', runnerResult.lhr.categories.seo.score * 100)
  
  await chrome.kill()
}

runLighthouse('http://localhost:5173')
```

**在 `package.json` 中添加腳本**:
```json
{
  "scripts": {
    "lighthouse": "node scripts/lighthouse-test.js"
  }
}
```

---

### 5. CI/CD 集成

**GitHub Actions 示例** (`.github/workflows/lighthouse.yml`):

```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:5173
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## 📈 預期改進效果

實施以上優化後，預期 Lighthouse 分數：

| 類別 | 優化前 | 優化後 | 提升 |
|------|--------|--------|------|
| Performance | 60-70 | 90-95 | +30 |
| Accessibility | 70-80 | 95-100 | +20 |
| Best Practices | 80-85 | 95-100 | +15 |
| SEO | 85-90 | 95-100 | +10 |

---

## 🎯 優先級建議

### 第一週：快速勝利（High Impact, Low Effort）

1. ✅ 移除生產環境 console.log
2. ✅ 添加圖片 width/height 屬性
3. ✅ 為圖片添加 alt 文字
4. ✅ 延遲加載 Google Analytics
5. ✅ 添加 ARIA 標籤

### 第二週：性能優化（High Impact, Medium Effort）

1. ✅ 自托管字體
2. ✅ 優化 FontAwesome（按需導入）
3. ✅ 圖片轉換為 WebP
4. ✅ 實施圖片懶加載
5. ✅ 優化代碼分割

### 第三週：深度優化（Medium Impact, High Effort）

1. ✅ 實施 PurgeCSS
2. ✅ 添加安全標頭
3. ✅ 優化結構化數據
4. ✅ 改善無障礙功能
5. ✅ 設置 CI/CD Lighthouse 測試

---

## 📚 相關資源

- [Lighthouse 文檔](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Schema.org](https://schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

---

## 🔄 持續監控

### 設置性能預算

**在 `lighthouserc.js` 中設置**:
```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['http://localhost:5173']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        
        // 具體指標
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }]
      }
    }
  }
}
```

---

**祝您優化順利！如有任何問題，歡迎隨時詢問。** 🚀
