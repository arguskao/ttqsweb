// 錯誤級別
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 錯誤類別
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  AUTH = 'auth',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  UNKNOWN = 'unknown'
}

// 錯誤日誌接口
export interface ErrorLog {
  level: ErrorLevel
  category: ErrorCategory
  message: string
  timestamp: string
  url: string
  userAgent: string
  userId?: number
  requestId?: string
  stack?: string
  context?: Record<string, any>
}

// 錯誤日誌服務
class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100 // 最多保存 100 條日誌

  // 記錄錯誤
  log(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    context?: Record<string, any>
  ): void {
    const log: ErrorLog = {
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    }

    // 添加到內存日誌
    this.logs.push(log)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // 移除最舊的日誌
    }

    // 根據級別輸出到控制台
    this.logToConsole(log)

    // 在生產環境中，可以發送到服務器
    if (import.meta.env.PROD && level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL) {
      this.sendToServer(log)
    }
  }

  // 輸出到控制台
  private logToConsole(log: ErrorLog): void {
    const prefix = `[${log.level.toUpperCase()}] [${log.category}]`
    const message = `${prefix} ${log.message}`

    switch (log.level) {
      case ErrorLevel.DEBUG:
        console.debug(message, log.context)
        break
      case ErrorLevel.INFO:
        console.info(message, log.context)
        break
      case ErrorLevel.WARNING:
        console.warn(message, log.context)
        break
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        console.error(message, log.context)
        if (log.stack) {
          console.error('Stack trace:', log.stack)
        }
        break
    }
  }

  // 發送到服務器（預留接口）
  private async sendToServer(log: ErrorLog): Promise<void> {
    try {
      // 這裡可以實現發送到錯誤監控服務
      // await fetch('/api/v1/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(log)
      // })
      console.log('Error log ready to send:', log)
    } catch (error) {
      console.error('Failed to send error log:', error)
    }
  }

  // 獲取所有日誌
  getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  // 獲取特定級別的日誌
  getLogsByLevel(level: ErrorLevel): ErrorLog[] {
    return this.logs.filter(log => log.level === level)
  }

  // 獲取特定類別的日誌
  getLogsByCategory(category: ErrorCategory): ErrorLog[] {
    return this.logs.filter(log => log.category === category)
  }

  // 清除日誌
  clearLogs(): void {
    this.logs = []
  }

  // 導出日誌（用於調試）
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // 便捷方法
  debug(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.DEBUG, category, message, context)
  }

  info(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.INFO, category, message, context)
  }

  warning(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.WARNING, category, message, context)
  }

  error(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.ERROR, category, message, context)
  }

  critical(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.CRITICAL, category, message, context)
  }
}

// 導出單例
export const errorLogger = new ErrorLogger()

// 全局錯誤處理器
export function setupGlobalErrorHandlers(): void {
  // 捕獲未處理的 Promise 錯誤
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error(
      ErrorCategory.RUNTIME,
      `Unhandled Promise Rejection: ${event.reason}`,
      {
        reason: event.reason,
        promise: event.promise
      }
    )
  })

  // 捕獲全局錯誤
  window.addEventListener('error', (event) => {
    errorLogger.error(
      ErrorCategory.RUNTIME,
      `Global Error: ${event.message}`,
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }
    )
  })
}
