/**
 * API端點提取器
 * 從路由中提取API端點元數據
 */

import type { ApiRouter, Route } from '../router'
import type {
  ApiEndpointMetadata,
  ApiParameter,
  ApiRequestBody,
  ApiResponses,
  ApiSchema,
  ApiSecurity
} from './types'

// API模式定義（擴展以支持$ref）
export interface ApiSchemaWithRef extends ApiSchema {
  $ref?: string
}

export class RouteExtractor {
  private readonly endpoints: Map<string, ApiEndpointMetadata> = new Map()

  /**
   * 從路由中提取端點元數據
   */
  extractFromRouter(router: ApiRouter): Map<string, ApiEndpointMetadata> {
    this.endpoints.clear()

    // 由於routes是私有屬性，我們需要通過其他方式獲取路由信息
    // 這裡我們假設路由器提供了一個公共方法來獲取路由
    const routes = (router as any).getRoutes?.() || []

    for (const route of routes) {
      this.extractFromRoute(route.path, route)
    }

    return this.endpoints
  }

  /**
   * 從單個路由中提取元數據
   */
  private extractFromRoute(path: string, route: Route): void {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

    for (const method of methods) {
      const handler = route[method.toLowerCase() as keyof Route]
      if (handler) {
        const endpointKey = `${method} ${path}`
        const metadata = this.extractMetadata(path, method, handler)
        this.endpoints.set(endpointKey, metadata)
      }
    }
  }

  /**
   * 提取端點元數據
   */
  private extractMetadata(path: string, method: string, handler: any): ApiEndpointMetadata {
    const metadata: ApiEndpointMetadata = {
      path,
      method,
      summary: this.generateSummary(path, method),
      description: this.generateDescription(path, method),
      tags: this.extractTags(path),
      parameters: this.extractParameters(path),
      requestBody: this.extractRequestBody(method, handler),
      responses: this.extractResponses(method),
      security: this.extractSecurity(path),
      deprecated: false,
      examples: this.generateExamples(path, method)
    }

    return metadata
  }

  /**
   * 生成端點摘要
   */
  private generateSummary(path: string, method: string): string {
    const pathParts = path.split('/').filter(Boolean)
    const resource = pathParts[0] || 'resource'
    const action = pathParts[1] || 'list'

    const actionMap: Record<string, string> = {
      GET: '獲取',
      POST: '創建',
      PUT: '更新',
      DELETE: '刪除',
      PATCH: '部分更新'
    }

    const resourceMap: Record<string, string> = {
      auth: '認證',
      users: '用戶',
      courses: '課程',
      jobs: '工作',
      instructors: '講師',
      documents: '文檔',
      analytics: '分析',
      admin: '管理',
      community: '社區'
    }

    const actionText = actionMap[method] || '操作'
    const resourceText = resourceMap[resource] || resource

    if (action === 'list' || action === '') {
      return `${actionText}${resourceText}列表`
    } else if (action.match(/^\d+$/)) {
      return `${actionText}${resourceText}詳情`
    } else {
      return `${actionText}${resourceText}${action}`
    }
  }

  /**
   * 生成端點描述
   */
  private generateDescription(path: string, method: string): string {
    const summary = this.generateSummary(path, method)
    return `${summary}的API端點`
  }

  /**
   * 提取標籤
   */
  private extractTags(path: string): string[] {
    const pathParts = path.split('/').filter(Boolean)
    const resource = pathParts[0] || 'system'

    const tagMap: Record<string, string> = {
      auth: 'Authentication',
      users: 'Users',
      courses: 'Courses',
      jobs: 'Jobs',
      instructors: 'Instructors',
      documents: 'Documents',
      analytics: 'Analytics',
      admin: 'Admin',
      community: 'Community',
      health: 'System',
      info: 'System'
    }

    return [tagMap[resource] || 'System']
  }

  /**
   * 提取參數
   */
  private extractParameters(path: string): ApiParameter[] {
    const parameters: ApiParameter[] = []

    // 提取路徑參數
    const pathParams = path.match(/:(\w+)/g)
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.substring(1)
        parameters.push({
          name: paramName,
          in: 'path',
          description: `${paramName}的ID`,
          required: true,
          schema: {
            type: 'number',
            description: `${paramName}的數值ID`
          },
          example: 1
        })
      }
    }

    // 添加常見的查詢參數
    if (path.includes('list') || path.split('/').length <= 2) {
      parameters.push(
        {
          name: 'page',
          in: 'query',
          description: '頁碼',
          required: false,
          schema: {
            type: 'number',
            minimum: 1,
            default: 1
          },
          example: 1
        },
        {
          name: 'limit',
          in: 'query',
          description: '每頁數量',
          required: false,
          schema: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          example: 20
        }
      )
    }

    return parameters
  }

  /**
   * 提取請求體
   */
  private extractRequestBody(method: string, handler: any): ApiRequestBody | undefined {
    if (method === 'GET' || method === 'DELETE') {
      return undefined
    }

    const path = handler.toString()
    const resource = this.guessResourceFromHandler(handler)

    return {
      description: `${method === 'POST' ? '創建' : '更新'}${resource}的數據`,
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${resource}`
          } as ApiSchemaWithRef,
          example: this.generateRequestBodyExample(resource)
        }
      }
    }
  }

  /**
   * 從處理器推測資源類型
   */
  private guessResourceFromHandler(handler: any): string {
    const handlerStr = handler.toString()

    if (handlerStr.includes('user')) return 'User'
    if (handlerStr.includes('course')) return 'Course'
    if (handlerStr.includes('job')) return 'Job'
    if (handlerStr.includes('instructor')) return 'Instructor'
    if (handlerStr.includes('document')) return 'Document'

    return 'Object'
  }

  /**
   * 生成請求體示例
   */
  private generateRequestBodyExample(resource: string): any {
    const examples: Record<string, any> = {
      User: {
        email: 'user@example.com',
        userType: 'job_seeker',
        firstName: '張',
        lastName: '三',
        phone: '0912345678'
      },
      Course: {
        title: '藥局助理基礎課程',
        description: '學習藥局助理的基本技能',
        durationHours: 40,
        price: 5000
      },
      Job: {
        title: '藥局助理',
        description: '協助藥師處理日常事務',
        company: 'XX藥局',
        location: '台北市',
        salary: 30000,
        employmentType: 'full_time'
      }
    }

    return examples[resource] ?? {}
  }

  /**
   * 提取響應
   */
  private extractResponses(method: string): ApiResponses {
    const responses: ApiResponses = {
      '200': {
        description: '請求成功',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            } as ApiSchemaWithRef
          }
        }
      },
      '400': {
        description: '請求參數錯誤',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            } as ApiSchemaWithRef
          }
        }
      },
      '401': {
        description: '未授權',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            } as ApiSchemaWithRef
          }
        }
      },
      '500': {
        description: '服務器內部錯誤',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            } as ApiSchemaWithRef
          }
        }
      }
    }

    // 為創建操作添加201響應
    if (method === 'POST') {
      responses['201'] = {
        description: '創建成功',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            } as ApiSchemaWithRef
          }
        }
      }
    }

    return responses
  }

  /**
   * 提取安全要求
   */
  private extractSecurity(path: string): ApiSecurity[] | undefined {
    // 健康檢查和信息端點不需要認證
    if (path === '/health' || path === '/info') {
      return undefined
    }

    // 認證端點不需要認證
    if (path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
      return undefined
    }

    // 其他端點需要認證
    return [
      {
        bearerAuth: []
      }
    ]
  }

  /**
   * 生成示例
   */
  private generateExamples(path: string, method: string): any {
    return {
      success: {
        summary: '成功響應',
        value: {
          success: true,
          data: method === 'GET' ? [] : {},
          meta: {
            timestamp: new Date().toISOString()
          }
        }
      },
      error: {
        summary: '錯誤響應',
        value: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '請求參數錯誤',
            statusCode: 400
          }
        }
      }
    }
  }

  /**
   * 獲取所有提取的端點
   */
  getEndpoints(): Map<string, ApiEndpointMetadata> {
    return this.endpoints
  }

  /**
   * 獲取端點統計
   */
  getStats(): {
    total: number
    byMethod: Record<string, number>
    byTag: Record<string, number>
  } {
    const stats = {
      total: this.endpoints.size,
      byMethod: {} as Record<string, number>,
      byTag: {} as Record<string, number>
    }

    for (const [key, endpoint] of this.endpoints) {
      const method = endpoint.method
      stats.byMethod[method] = (stats.byMethod[method] ?? 0) + 1

      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          stats.byTag[tag] = (stats.byTag[tag] ?? 0) + 1
        }
      }
    }

    return stats
  }
}
