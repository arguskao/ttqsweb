# Lighthouse 優化實戰指南

> **專案**: 藥助Next學院  
> **更新日期**: 2025-11-20  
> **目標**: 達到 Lighthouse 90+ 全項目分數

---

## 📊 評分目標

| 項目 | 當前預估 | 目標 | 主要優化方向 |
|------|---------|------|------------|
| 🚀 Performance | 60-70 | 90+ | 字體、圖片、JS優化 |
| ♿ Accessibility | 70-80 | 95+ | ARIA、語義化、對比度 |
| ✅ Best Practices | 80-85 | 95+ | 安全標頭、錯誤處理 |
| 🔍 SEO | 85-90 | 95+ | Meta、結構化數據 |

---

## 🎯 三週優化計劃

### 第一週：快速勝利 ⚡

#### 1. 延遲加載 Google Analytics

**問題**: GA 阻塞初始渲染  
**影響**: Performance -5 分

**解決方案**:

移除 `index.html` 第 94-102 行的 GA 代碼，改為動態加載：

```typescript
// src/utils/analytics.ts
export class Analytics {
  private initialized = false

  async init() {
    if (this.initialized || !import.meta.env.VITE_GA_TRACKING_ID) return

    // 使用 requestIdleCallback 延遲加載
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadGA())
    } else {
      setTimeout(() => this.loadGA(), 2000)
    }
  }

  private loadGA() {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_TRACKING_ID}`
    
    script.onload = () => {
      window.dataLayer = window.dataLayer || []
      window.gtag = function() { window.dataLayer.push(arguments) }
      window.gtag('js', new Date())
      window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID)
      this.initialized = true
    }
    
    document.head.appendChild(script)
  }
}
```

```typescript
// src/main.ts - 在應用掛載後初始化
app.mount('#app')

// 延遲初始化 analytics
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => analytics.init())
} else {
  setTimeout(() => analytics.init(), 2000)
}
```

**預期效果**: FCP -100ms, TBT -50ms

---

#### 2. 圖片優化基礎

**問題**: 缺少尺寸屬性導致 CLS  
**影響**: Performance -10 分

**解決方案**:

```vue
<!-- ❌ 錯誤：會導致 CLS -->
<img src="/images/course.jpg" alt="課程">

<!-- ✅ 正確：預留空間 -->
<img 
  src="/images/course.jpg" 
  alt="藥局助理基礎課程"
  width="800" 
  height="600"
  loading="lazy"
>
```

**批量檢查腳本**:
```bash
# 找出所有缺少 width/height 的圖片
grep -r "<img" src/ | grep -v "width=" | grep -v "height="
```

**預期效果**: CLS < 0.1

---

#### 3. 移除生產環境 Console

**問題**: Console 輸出影響 Best Practices  
**影響**: Best Practices -5 分

**解決方案**:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'] // 自動移除 console 和 debugger
    }
  }
})
```

**預期效果**: Best Practices +5 分

---

#### 4. 添加基本 ARIA 標籤

**問題**: 缺少無障礙標籤  
**影響**: Accessibility -10 分

**解決方案**:

```vue
<template>
  <!-- 導航 -->
  <nav aria-label="主導航">
    <ul>
      <li><router-link to="/">首頁</router-link></li>
      <li><router-link to="/courses">課程</router-link></li>
    </ul>
  </nav>

  <!-- 搜尋 -->
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
</template>
```

**預期效果**: Accessibility +10 分

---

### 第二週：性能提升 🚀

#### 5. 自托管字體（重要！）

**問題**: Google Fonts CDN 阻塞渲染  
**影響**: Performance -15 分

**解決方案**:

**步驟 1**: 下載字體文件
- 訪問 [Google Webfonts Helper](https://gwfh.mranftl.com/fonts/noto-sans-tc)
- 選擇需要的字重：400, 700
- 下載 woff2 格式

**步驟 2**: 放置字體文件
```
public/
└── fonts/
    ├── noto-sans-tc-400.woff2
    └── noto-sans-tc-700.woff2
```

**步驟 3**: 在 `src/assets/main.css` 中定義
```css
/* 自托管 Noto Sans TC */
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* 重要：避免 FOIT */
  src: url('/fonts/noto-sans-tc-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/noto-sans-tc-700.woff2') format('woff2');
}
```

**步驟 4**: 在 `index.html` 中預加載
```html
<!-- 預加載關鍵字體 -->
<link rel="preload" href="/fonts/noto-sans-tc-400.woff2" 
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-tc-700.woff2" 
      as="font" type="font/woff2" crossorigin>
```

**步驟 5**: 移除 Google Fonts CDN
```html
<!-- 刪除 index.html 中的這些行 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
  as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**預期效果**: LCP -300ms, FCP -200ms

---

#### 6. FontAwesome 按需導入

**問題**: 完整 FontAwesome CDN 約 70KB  
**影響**: Performance -10 分

**解決方案**:

**步驟 1**: 安裝依賴
```bash
npm install @fortawesome/fontawesome-svg-core
npm install @fortawesome/free-solid-svg-icons
npm install @fortawesome/vue-fontawesome@latest-3
```

**步驟 2**: 在 `src/main.ts` 中配置
```typescript
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// 只導入需要的圖標
import { 
  faUser, 
  faBook, 
  faGraduationCap,
  faBriefcase,
  faChartLine,
  faSearch,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons'

// 添加到庫
library.add(
  faUser, 
  faBook, 
  faGraduationCap, 
  faBriefcase, 
  faChartLine,
  faSearch,
  faBars,
  faTimes
)

// 註冊組件
app.component('font-awesome-icon', FontAwesomeIcon)
```

**步驟 3**: 在組件中使用
```vue
<template>
  <!-- 舊方式 -->
  <i class="fa fa-user"></i>
  
  <!-- 新方式 -->
  <font-awesome-icon icon="user" />
</template>
```

**步驟 4**: 移除 CDN
```html
<!-- 刪除 index.html 中的這行 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

**預期效果**: Bundle -60KB, FCP -150ms

---

#### 7. 圖片轉換為 WebP

**問題**: JPG/PNG 文件過大  
**影響**: Performance -15 分

**解決方案**:

**方案 1**: 使用在線工具轉換
- [Squoosh](https://squoosh.app/)
- [CloudConvert](https://cloudconvert.com/jpg-to-webp)

**方案 2**: 使用命令行工具
```bash
# 安裝 cwebp
brew install webp  # macOS
# 或
sudo apt-get install webp  # Linux

# 批量轉換
for file in public/images/*.jpg; do
  cwebp -q 80 "$file" -o "${file%.jpg}.webp"
done
```

**方案 3**: 使用 Vite 插件（推薦）
```bash
npm install vite-plugin-imagemin -D
```

```typescript
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    vue(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      }
    })
  ]
})
```

**使用 Picture 元素**:
```vue
<template>
  <picture>
    <source srcset="/images/hero.webp" type="image/webp">
    <source srcset="/images/hero.jpg" type="image/jpeg">
    <img 
      src="/images/hero.jpg" 
      alt="藥助Next學院"
      width="1200"
      height="600"
      loading="eager"
    >
  </picture>
</template>
```

**創建可重用組件** `src/components/common/OptimizedImage.vue`:
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
  src="/images/course.jpg"
  alt="藥局助理課程"
  width="800"
  height="600"
  loading="lazy"
/>
```

**預期效果**: LCP -500ms, 圖片大小 -40%

---

#### 8. 代碼分割優化

**當前配置已不錯，但可以改進**:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 第三方庫分類
          if (id.includes('node_modules')) {
            // Vue 核心
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue'
            }
            
            // 工具庫
            if (id.includes('axios') || id.includes('lodash') || id.includes('dayjs')) {
              return 'vendor-utils'
            }
            
            // 其他第三方庫
            return 'vendor-other'
          }
          
          // 按路由分割（已有的配置保持）
          if (id.includes('/views/admin/')) return 'route-admin'
          if (id.includes('/views/auth/')) return 'route-auth'
          if (id.includes('/views/courses/')) return 'route-courses'
          if (id.includes('/views/instructor/')) return 'route-instructors'
          if (id.includes('/views/jobs/')) return 'route-jobs'
        }
      }
    },
    // 提高警告閾值
    chunkSizeWarningLimit: 1000
  }
})
```

**預期效果**: 初始 Bundle -20%

---

### 第三週：深度優化 🎯

#### 9. 安全標頭配置

**問題**: 缺少安全標頭  
**影響**: Best Practices -10 分

**解決方案**:

更新 `public/_headers`:
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
  
  # HSTS
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  
  # 緩存控制
  Cache-Control: public, max-age=31536000, immutable

# HTML 不緩存
/*.html
  Cache-Control: no-cache, no-store, must-revalidate

# Service Worker 不緩存
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
```

**預期效果**: Best Practices +10 分

---

#### 10. 優化結構化數據

**當前的 JSON-LD 已經不錯，但可以擴展**:

```html
<!-- index.html -->
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
        "addressLocality": "台北市"
      },
      "sameAs": [
        "https://www.facebook.com/pharmacy-academy",
        "https://www.linkedin.com/company/pharmacy-academy"
      ]
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
    }
  ]
}
</script>
```

**為課程頁面添加 Course Schema**:
```vue
<!-- CourseDetailView.vue -->
<script setup lang="ts">
import { useHead } from '@vueuse/head'

const course = ref({
  name: '藥局助理基礎課程',
  description: '學習藥局助理的基本知識與技能',
  price: 15000
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.value.name,
        description: course.value.description,
        provider: {
          '@type': 'Organization',
          name: '藥助Next學院',
          url: 'https://pharmacy-academy.com'
        },
        offers: {
          '@type': 'Offer',
          category: 'Paid',
          price: course.value.price,
          priceCurrency: 'TWD'
        }
      })
    }
  ]
})
</script>
```

**預期效果**: SEO +5 分

---

#### 11. 無障礙深度優化

**顏色對比度檢查**:

```css
/* ❌ 對比度不足 (2.85:1) */
.text-light {
  color: #999;
  background: #fff;
}

/* ✅ 對比度充足 (5.74:1) */
.text-light {
  color: #666;
  background: #fff;
}

/* ✅ 大文字可以用較低對比度 (3.5:1) */
.heading {
  font-size: 24px;
  font-weight: bold;
  color: #767676;
  background: #fff;
}
```

**焦點管理**:

```css
/* 為鍵盤用戶提供清晰的焦點指示 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #00d1b2;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 209, 178, 0.2);
}

/* 移除滑鼠點擊時的焦點輪廓 */
button:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}
```

**跳過導航連結**:

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- 跳過導航連結（對螢幕閱讀器友好） -->
    <a href="#main-content" class="skip-link">
      跳至主要內容
    </a>
    
    <AppHeader />
    
    <main id="main-content" tabindex="-1">
      <RouterView />
    </main>
    
    <AppFooter />
  </div>
</template>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #00d1b2;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

**預期效果**: Accessibility +5 分

---

#### 12. 設置 Lighthouse CI

**創建 `.github/workflows/lighthouse.yml`**:

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
          
      - name: Check Lighthouse scores
        run: |
          echo "Lighthouse CI completed"
```

**創建 `lighthouserc.js`**:

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
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }]
      }
    }
  }
}
```

**預期效果**: 持續監控性能

---

## 📋 快速檢查清單

### Performance ✅

- [ ] 字體已自托管，使用 `font-display: swap`
- [ ] 移除 FontAwesome CDN，改用按需導入
- [ ] 圖片轉換為 WebP 格式
- [ ] 所有圖片設置 `width` 和 `height`
- [ ] 非首屏圖片使用 `loading="lazy"`
- [ ] 關鍵資源使用 `preload`
- [ ] Google Analytics 延遲加載
- [ ] 代碼分割已優化
- [ ] 生產環境移除 `console.log`
- [ ] 啟用 Gzip/Brotli 壓縮

### Accessibility ✅

- [ ] 所有圖片都有描述性 `alt` 文字
- [ ] 表單元素都有 `label` 或 `aria-label`
- [ ] 使用語義化 HTML 標籤
- [ ] 顏色對比度符合 WCAG AA 標準（4.5:1）
- [ ] 可以完全使用鍵盤導航
- [ ] 焦點狀態清晰可見
- [ ] 互動元素有適當的 ARIA 標籤
- [ ] 動態內容使用 `aria-live`
- [ ] 有跳過導航連結

### Best Practices ✅

- [ ] 使用 HTTPS
- [ ] 設置了安全標頭（CSP, HSTS, X-Frame-Options）
- [ ] 沒有 console 錯誤或警告
- [ ] 使用現代 JavaScript (ES2020+)
- [ ] 圖片使用適當的格式和尺寸
- [ ] 沒有使用已棄用的 API
- [ ] 有全局錯誤處理

### SEO ✅

- [ ] 每個頁面都有唯一的 `<title>`（50-60字符）
- [ ] 每個頁面都有唯一的 `<meta description>`（150-160字符）
- [ ] 使用了結構化數據 (JSON-LD)
- [ ] 有 `sitemap.xml`
- [ ] 有 `robots.txt`
- [ ] 使用了語義化 HTML
- [ ] 內部連結使用描述性錨文字
- [ ] 移動端友好
- [ ] 有 Canonical URL

---

## 🧪 測試方法

### 1. Chrome DevTools Lighthouse

```
1. 打開 Chrome DevTools (F12)
2. 切換到 "Lighthouse" 標籤
3. 選擇設備類型（Mobile/Desktop）
4. 勾選所有類別
5. 點擊 "Analyze page load"
```

### 2. 命令行測試

```bash
# 安裝 Lighthouse CLI
npm install -g lighthouse

# 測試本地開發環境
npm run dev
lighthouse http://localhost:5173 --view

# 測試生產構建
npm run build
npm run preview
lighthouse http://localhost:4173 --view

# 只測試性能
lighthouse http://localhost:5173 --only-categories=performance --view

# 模擬移動設備
lighthouse http://localhost:5173 --preset=mobile --view
```

### 3. PageSpeed Insights

訪問 [PageSpeed Insights](https://pagespeed.web.dev/) 測試線上網站。

---

## 📊 預期改進效果

| 類別 | 優化前 | 優化後 | 提升 | 關鍵優化 |
|------|--------|--------|------|---------|
| Performance | 60-70 | 90-95 | +30 | 字體、圖片、GA |
| Accessibility | 70-80 | 95-100 | +20 | ARIA、對比度 |
| Best Practices | 80-85 | 95-100 | +15 | 安全標頭、Console |
| SEO | 85-90 | 95-100 | +10 | 結構化數據 |

### 核心 Web Vitals 改善

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| LCP | ~3.5s | <2.5s | -1.0s |
| FID | ~150ms | <100ms | -50ms |
| CLS | ~0.15 | <0.1 | -0.05 |
| FCP | ~2.5s | <1.8s | -0.7s |
| TBT | ~300ms | <200ms | -100ms |

---

## 🎯 實施優先級

### P0 - 立即實施（本週）

1. ✅ 延遲加載 Google Analytics
2. ✅ 為所有圖片添加 `width`/`height` 和 `alt`
3. ✅ 移除生產環境 `console.log`
4. ✅ 添加基本 ARIA 標籤

**預期提升**: Performance +10, Accessibility +10, Best Practices +5

### P1 - 重要（下週）

5. ✅ 自托管字體
6. ✅ FontAwesome 按需導入
7. ✅ 圖片轉換為 WebP
8. ✅ 優化代碼分割

**預期提升**: Performance +20

### P2 - 優化（第三週）

9. ✅ 添加安全標頭
10. ✅ 優化結構化數據
11. ✅ 無障礙深度優化
12. ✅ 設置 Lighthouse CI

**預期提升**: Best Practices +10, Accessibility +5, SEO +5

---

## 🔧 常用工具

### 性能測試
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

### 圖片優化
- [Squoosh](https://squoosh.app/) - 在線圖片壓縮
- [TinyPNG](https://tinypng.com/) - PNG/JPG 壓縮
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - SVG 優化

### 無障礙檢查
- [WAVE](https://wave.webaim.org/) - 無障礙評估工具
- [axe DevTools](https://www.deque.com/axe/devtools/) - Chrome 擴展
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - 對比度檢查

### 字體工具
- [Google Webfonts Helper](https://gwfh.mranftl.com/) - 下載 Google Fonts
- [Font Squirrel](https://www.fontsquirrel.com/tools/webfont-generator) - 字體轉換

### SEO 工具
- [Schema Markup Validator](https://validator.schema.org/) - 驗證結構化數據
- [Rich Results Test](https://search.google.com/test/rich-results) - Google 富媒體測試

---

## 💡 小技巧

### 1. 快速找出性能瓶頸

```javascript
// 在 main.ts 中添加性能標記
performance.mark('app-start')

app.mount('#app')

performance.mark('app-mounted')
performance.measure('app-init', 'app-start', 'app-mounted')

const measure = performance.getEntriesByName('app-init')[0]
console.log(`App initialization took ${measure.duration}ms`)
```

### 2. 監控 Bundle 大小

```bash
# 在 package.json 中添加
{
  "scripts": {
    "build:analyze": "vite build --mode production && npx vite-bundle-visualizer"
  }
}
```

### 3. 自動化圖片優化

```bash
# 創建 npm script
{
  "scripts": {
    "optimize:images": "find public/images -name '*.jpg' -exec cwebp -q 80 {} -o {}.webp \\;"
  }
}
```

---

## 📞 需要協助？

如果您在實施過程中遇到任何問題，或需要針對特定項目的詳細指導，請隨時詢問！

**常見問題**:
- 如何批量轉換圖片？
- FontAwesome 圖標找不到怎麼辦？
- 如何測試本地環境的 Lighthouse 分數？
- CSP 設置導致腳本無法執行？

---

**祝您優化順利！目標：全項目 90+ 分！** 🚀
