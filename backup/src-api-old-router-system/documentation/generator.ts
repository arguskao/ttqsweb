/**
 * API文檔生成器核心
 * 整合所有組件，提供統一的API文檔生成接口
 */

import type { ApiRouter } from '../router'

import { RouteExtractor } from './extractor'
import { DocumentationFormatter } from './formatter'
import type { ApiEndpointMetadata, OpenAPISpec, DocumentationOptions } from './types'

export class ApiDocumentationGenerator {
  private readonly extractor: RouteExtractor
  private readonly formatter: DocumentationFormatter
  private endpoints: Map<string, ApiEndpointMetadata> = new Map()

  constructor(options: DocumentationOptions = {}) {
    this.extractor = new RouteExtractor()
    this.formatter = new DocumentationFormatter(options)
  }

  /**
   * 從路由提取端點
   */
  extractFromRouter(router: ApiRouter): Map<string, ApiEndpointMetadata> {
    this.endpoints = this.extractor.extractFromRouter(router)
    return this.endpoints
  }

  /**
   * 生成OpenAPI規範
   */
  generateOpenAPISpec(): OpenAPISpec {
    return this.formatter.generateOpenAPISpec(this.endpoints)
  }

  /**
   * 生成Swagger UI HTML
   */
  generateSwaggerUI(): string {
    const spec = this.generateOpenAPISpec()
    return this.formatter.generateSwaggerUI(spec)
  }

  /**
   * 生成Markdown文檔
   */
  generateMarkdown(): string {
    return this.formatter.generateMarkdown(this.endpoints)
  }

  /**
   * 從路由生成文檔
   */
  generateFromRouter(router: ApiRouter): {
    openApiSpec: OpenAPISpec
    markdown: string
    swaggerUI: string
    stats: any
  } {
    // 提取端點元數據
    this.endpoints = this.extractor.extractFromRouter(router)

    // 生成各種格式的文檔
    const openApiSpec = this.formatter.generateOpenAPISpec(this.endpoints)
    const markdown = this.formatter.generateMarkdown(this.endpoints)
    const swaggerUI = this.formatter.generateSwaggerUI(openApiSpec)
    const stats = this.formatter.generateStats(this.endpoints)

    return {
      openApiSpec,
      markdown,
      swaggerUI,
      stats
    }
  }

  /**
   * 添加預定義端點
   */
  addPredefinedEndpoints(): void {
    const predefinedEndpoints: ApiEndpointMetadata[] = [
      {
        path: '/health',
        method: 'GET',
        summary: '健康檢查',
        description: '檢查API服務狀態',
        tags: ['System'],
        responses: {
          '200': {
            description: '服務正常',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        version: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/info',
        method: 'GET',
        summary: 'API信息',
        description: '獲取API基本信息',
        tags: ['System'],
        responses: {
          '200': {
            description: 'API信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        version: { type: 'string' },
                        description: { type: 'string' },
                        endpoints: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/optimization/test',
        method: 'GET',
        summary: 'API優化測試',
        description: '測試API優化功能',
        tags: ['System'],
        responses: {
          '200': {
            description: '優化測試結果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        features: { type: 'array', items: { type: 'string' } },
                        timestamp: { type: 'string' },
                        requestId: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/errors/stats',
        method: 'GET',
        summary: '錯誤統計',
        description: '獲取系統錯誤統計信息',
        tags: ['System'],
        responses: {
          '200': {
            description: '錯誤統計',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalErrors: { type: 'number' },
                        errorsBySeverity: { type: 'object' },
                        errorsByCategory: { type: 'object' },
                        topErrors: { type: 'array' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/batch',
        method: 'POST',
        summary: '批量操作',
        description: '執行批量API請求',
        tags: ['System'],
        requestBody: {
          description: '批量請求數據',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    method: { type: 'string' },
                    url: { type: 'string' },
                    body: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '批量操作結果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        results: { type: 'array' },
                        total: { type: 'number' },
                        successful: { type: 'number' },
                        failed: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/db/fix',
        method: 'GET',
        summary: '數據庫修復',
        description: '修復數據庫連接問題',
        tags: ['System'],
        responses: {
          '200': {
            description: '修復結果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        test: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/db/optimize',
        method: 'GET',
        summary: '數據庫優化',
        description: '優化數據庫性能',
        tags: ['System'],
        parameters: [
          {
            name: 'action',
            in: 'query',
            description: '優化操作類型',
            schema: {
              type: 'string',
              enum: ['indexes', 'constraints', 'cleanup', 'analyze', 'full']
            }
          }
        ],
        responses: {
          '200': {
            description: '優化結果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      {
        path: '/db/n1-check',
        method: 'GET',
        summary: 'N+1問題檢測',
        description: '檢測數據庫N+1查詢問題',
        tags: ['System'],
        parameters: [
          {
            name: 'action',
            in: 'query',
            description: '檢測操作類型',
            schema: {
              type: 'string',
              enum: ['detect']
            }
          }
        ],
        responses: {
          '200': {
            description: '檢測結果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        problems: { type: 'array' },
                        totalProblems: { type: 'number' },
                        highSeverity: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]

    // 添加預定義端點
    for (const endpoint of predefinedEndpoints) {
      const key = `${endpoint.method} ${endpoint.path}`
      this.endpoints.set(key, endpoint)
    }
  }

  /**
   * 獲取所有端點
   */
  getEndpoints(): Map<string, ApiEndpointMetadata> {
    return this.endpoints
  }

  /**
   * 註冊單個端點
   */
  registerEndpoint(metadata: ApiEndpointMetadata): void {
    const key = `${metadata.method} ${metadata.path}`
    this.endpoints.set(key, metadata)
  }

  /**
   * 獲取端點統計
   */
  getStats(): any {
    return this.formatter.generateStats(this.endpoints)
  }

  /**
   * 獲取schemas
   */
  get schemas(): any {
    return this.formatter.getSchemas()
  }

  /**
   * 獲取tags
   */
  get tags(): any {
    return this.formatter.getTags()
  }

  /**
   * 重新掃描端點
   */
  rescanEndpoints(router: ApiRouter): void {
    this.endpoints.clear()
    this.addPredefinedEndpoints()
    this.endpoints = new Map([...this.endpoints, ...this.extractor.extractFromRouter(router)])
  }
}
