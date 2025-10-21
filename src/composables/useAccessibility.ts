import { ref, onMounted, onUnmounted } from 'vue'

// 鍵盤導航 composable
export function useKeyboardNavigation() {
  const focusedElement = ref<HTMLElement | null>(null)
  const focusableElements = ref<HTMLElement[]>([])

  const updateFocusableElements = (container: HTMLElement) => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]'
    ]

    focusableElements.value = Array.from(
      container.querySelectorAll(selectors.join(', '))
    ) as HTMLElement[]
  }

  const focusNext = () => {
    if (focusableElements.value.length === 0) return

    const currentIndex = focusedElement.value
      ? focusableElements.value.indexOf(focusedElement.value)
      : -1

    const nextIndex = (currentIndex + 1) % focusableElements.value.length
    focusableElements.value[nextIndex]?.focus()
  }

  const focusPrevious = () => {
    if (focusableElements.value.length === 0) return

    const currentIndex = focusedElement.value
      ? focusableElements.value.indexOf(focusedElement.value)
      : -1

    const prevIndex = currentIndex <= 0 ? focusableElements.value.length - 1 : currentIndex - 1

    focusableElements.value[prevIndex]?.focus()
  }

  const focusFirst = () => {
    focusableElements.value[0]?.focus()
  }

  const focusLast = () => {
    focusableElements.value[focusableElements.value.length - 1]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Tab':
        if (event.shiftKey) {
          event.preventDefault()
          focusPrevious()
        } else {
          event.preventDefault()
          focusNext()
        }
        break
      case 'Home':
        event.preventDefault()
        focusFirst()
        break
      case 'End':
        event.preventDefault()
        focusLast()
        break
      case 'Escape':
        // 可以添加關閉模態框等邏輯
        break
    }
  }

  return {
    focusedElement,
    focusableElements,
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    handleKeyDown
  }
}

// 屏幕閱讀器支持 composable
export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // 清理
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const announcePageChange = (pageTitle: string) => {
    announce(`頁面已更改為: ${pageTitle}`)
  }

  const announceError = (errorMessage: string) => {
    announce(`錯誤: ${errorMessage}`, 'assertive')
  }

  const announceSuccess = (successMessage: string) => {
    announce(`成功: ${successMessage}`)
  }

  return {
    announce,
    announcePageChange,
    announceError,
    announceSuccess
  }
}

// 跳過連結 composable
export function useSkipLink() {
  const createSkipLink = (targetId: string, text = '跳到主內容') => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.setAttribute('tabindex', '1')

    // 添加到頁面頂部
    document.body.insertBefore(skipLink, document.body.firstChild)

    return skipLink
  }

  const setupSkipLinks = () => {
    // 主內容跳過連結
    createSkipLink('main-content', '跳到主內容')

    // 導航跳過連結
    createSkipLink('main-navigation', '跳到導航')

    // 搜索跳過連結
    const searchElement = document.querySelector('[role="search"]')
    if (searchElement) {
      createSkipLink(searchElement.id || 'search', '跳到搜索')
    }
  }

  return {
    createSkipLink,
    setupSkipLinks
  }
}

// 焦點管理 composable
export function useFocusManagement() {
  const focusHistory = ref<HTMLElement[]>([])
  const trapFocus = ref(false)

  const saveFocus = () => {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      focusHistory.value.push(activeElement)
    }
  }

  const restoreFocus = () => {
    const lastFocused = focusHistory.value.pop()
    if (lastFocused) {
      lastFocused.focus()
    }
  }

  const trapFocusInElement = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (!firstElement || !lastElement) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    focusHistory,
    trapFocus,
    saveFocus,
    restoreFocus,
    trapFocusInElement
  }
}

// 高對比度檢測 composable
export function useHighContrast() {
  const isHighContrast = ref(false)

  const checkHighContrast = () => {
    // 檢測系統高對比度設置
    if (window.matchMedia) {
      isHighContrast.value = window.matchMedia('(prefers-contrast: high)').matches
    }
  }

  onMounted(() => {
    checkHighContrast()

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)')
      mediaQuery.addEventListener('change', checkHighContrast)

      onUnmounted(() => {
        mediaQuery.removeEventListener('change', checkHighContrast)
      })
    }
  })

  return {
    isHighContrast
  }
}

// 減少動畫檢測 composable
export function useReducedMotion() {
  const prefersReducedMotion = ref(false)

  const checkReducedMotion = () => {
    if (window.matchMedia) {
      prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  onMounted(() => {
    checkReducedMotion()

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      mediaQuery.addEventListener('change', checkReducedMotion)

      onUnmounted(() => {
        mediaQuery.removeEventListener('change', checkReducedMotion)
      })
    }
  })

  return {
    prefersReducedMotion
  }
}

// 顏色對比度檢查函數
export function checkColorContrast(foreground: string, background: string): number {
  // 簡化的對比度計算
  // 實際應用中應該使用更精確的算法
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return 0

    const [rRaw, gRaw, bRaw] = rgb.map(n => Number(n)) as number[]
    const r = (rRaw ?? 0) / 255
    const g = (gRaw ?? 0) / 255
    const b = (bRaw ?? 0) / 255

    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    const rs = toLinear(r)
    const gs = toLinear(g)
    const bs = toLinear(b)

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const lum1 = getLuminance(foreground)
  const lum2 = getLuminance(background)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// ARIA 標籤生成器
export function generateAriaLabels() {
  const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`

  const createAriaDescribedBy = (element: HTMLElement, description: string) => {
    const id = generateId('aria-desc')
    const descElement = document.createElement('div')
    descElement.id = id
    descElement.className = 'sr-only'
    descElement.textContent = description

    element.setAttribute('aria-describedby', id)
    element.parentNode?.insertBefore(descElement, element.nextSibling)

    return id
  }

  const createAriaLabelledBy = (element: HTMLElement, label: string) => {
    const id = generateId('aria-label')
    const labelElement = document.createElement('div')
    labelElement.id = id
    labelElement.className = 'sr-only'
    labelElement.textContent = label

    element.setAttribute('aria-labelledby', id)
    element.parentNode?.insertBefore(labelElement, element)

    return id
  }

  return {
    generateId,
    createAriaDescribedBy,
    createAriaLabelledBy
  }
}
