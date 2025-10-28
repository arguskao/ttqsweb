/// <reference types="vite/client" />

// 擴展 Window 接口以包含 gtag 函數
interface Window {
    gtag?: (...args: any[]) => void
}
