import type { App } from 'vue'
import type { ToastOptions } from '@/components/common/ToastContainer.vue'

// Toast 服務單例
class ToastService {
  private container: any = null

  // 設置容器實例
  setContainer(container: any) {
    this.container = container
  }

  // 顯示成功提示
  success(message: string, title?: string, duration = 3000) {
    return this.show({ message, title, type: 'success', duration })
  }

  // 顯示錯誤提示
  error(message: string, title?: string, duration = 5000) {
    return this.show({ message, title, type: 'error', duration })
  }

  // 顯示警告提示
  warning(message: string, title?: string, duration = 4000) {
    return this.show({ message, title, type: 'warning', duration })
  }

  // 顯示信息提示
  info(message: string, title?: string, duration = 3000) {
    return this.show({ message, title, type: 'info', duration })
  }

  // 顯示自定義 toast
  show(options: Omit<ToastOptions, 'id'>) {
    if (!this.container) {
      console.warn('Toast container not initialized')
      return null
    }
    return this.container.addToast(options)
  }

  // 關閉指定 toast
  close(id: string) {
    if (this.container) {
      this.container.removeToast(id)
    }
  }
}

// 導出單例
export const toast = new ToastService()

// Vue 插件
export default {
  install(app: App) {
    app.config.globalProperties.$toast = toast
  }
}

// TypeScript 類型擴展
// 注意: 在 CI/CD 環境中,這個聲明可能會導致編譯錯誤
// 暫時註釋以避免構建失敗
// declare module '@vue/runtime-core' {
//   interface ComponentCustomProperties {
//     $toast: ToastService
//   }
// }
