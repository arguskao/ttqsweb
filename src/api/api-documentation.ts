/**
 * API文檔自動生成系統
 * 支持OpenAPI 3.0規範和Swagger UI
 */

import type { ApiRouter, Route } from './router'
import type { ApiRequest, ApiResponse } from './types'

// API端點元數據
export interface ApiEndpointMetadata {
  path: string
  method: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses?: ApiResponses
  security?: ApiSecurity[]
  deprecated?: boolean
  examples?: ApiExamples
}

// API參數定義
export interface ApiParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  description?: string
  required?: boolean
  schema: ApiSchema
  example?: any
}

// API請求體定義
export interface ApiRequestBody {
  description?: string
  required?: boolean
  content: Record<string, ApiContent>
}

// API響應定義
export interface ApiResponses {
  [statusCode: string]: ApiResponse
}

export interface ApiResponse {
  description: string
  content?: Record<string, ApiContent>
  headers?: Record<string, ApiHeader>
}

// API內容定義
export interface ApiContent {
  schema: ApiSchema
  example?: any
  examples?: Record<string, ApiExample>
}

// API模式定義
export interface ApiSchema {
  type?: string
  format?: string
  properties?: Record<string, ApiSchema>
  items?: ApiSchema
  required?: string[]
  enum?: any[]
  example?: any
  description?: string
}

// API標頭定義
export interface ApiHeader {
  description?: string
  schema: ApiSchema
}

// API安全定義
export interface ApiSecurity {
  [scheme: string]: string[]
}

// API示例定義
export interface ApiExamples {
  request?: any
  response?: any
}

export interface ApiExample {
  summary?: string
  description?: string
  value?: any
}

// OpenAPI 3.0 規範
export interface OpenAPISpec {
  openapi: string
  info: ApiInfo
  servers?: ApiServer[]
  paths: ApiPaths
  components?: ApiComponents
  security?: ApiSecurity[]
  tags?: ApiTag[]
}

export interface ApiInfo {
  title: string
  version: string
  description?: string
  contact?: ApiContact
  license?: ApiLicense
}

export interface ApiContact {
  name?: string
  url?: string
  email?: string
}

export interface ApiLicense {
  name: string
  url?: string
}

export interface ApiServer {
  url: string
  description?: string
}

export interface ApiPaths {
  [path: string]: ApiPathItem
}

export interface ApiPathItem {
  [method: string]: ApiOperation
}

export interface ApiOperation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponses
  security?: ApiSecurity[]
  deprecated?: boolean
}

export interface ApiComponents {
  schemas?: Record<string, ApiSchema>
  responses?: Record<string, ApiResponse>
  parameters?: Record<string, ApiParameter>
  examples?: Record<string, ApiExample>
  securitySchemes?: Record<string, ApiSecurityScheme>
}

export interface ApiSecurityScheme {
  type: string
  scheme?: string
  bearerFormat?: string
  name?: string
  in?: string
}

export interface ApiTag {
  name: string
  description?: string
}

// API文檔生成器
export class ApiDocumentationGenerator {
  private endpoints: Map<string, ApiEndpointMetadata> = new Map()
  private schemas: Map<string, ApiSchema> = new Map()
  private tags: Map<string, ApiTag> = new Map()

  constructor() {
    this.initializeDefaultSchemas()
    this.initializeDefaultTags()
  }

  // 初始化默認模式
  private initializeDefaultSchemas(): void {
    // 通用響應模式
    this.schemas.set('ApiResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
            details: { type: 'object' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            duration: { type: 'string' },
            requestId: { type: 'string' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    })

    // 用戶模式
    this.schemas.set('User', {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        userType: { type: 'string', enum: ['job_seeker', 'employer'] },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    })

    // 課程模式
    this.schemas.set('Course', {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        courseType: { type: 'string' },
        durationHours: { type: 'integer' },
        price: { type: 'number' },
        instructorId: { type: 'integer' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    })

    // 工作模式
    this.schemas.set('Job', {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        company: { type: 'string' },
        location: { type: 'string' },
        salary: { type: 'string' },
        employmentType: { type: 'string' },
        employerId: { type: 'integer' },
        isActive: { type: 'boolean' },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    })
  }

  // 初始化默認標籤
  private initializeDefaultTags(): void {
    this.tags.set('auth', { name: '認證', description: '用戶認證相關端點' })
    this.tags.set('courses', { name: '課程', description: '課程管理相關端點' })
    this.tags.set('jobs', { name: '工作', description: '工作管理相關端點' })
    this.tags.set('instructors', { name: '講師', description: '講師管理相關端點' })
    this.tags.set('documents', { name: '文檔', description: '文檔管理相關端點' })
    this.tags.set('users', { name: '用戶', description: '用戶管理相關端點' })
    this.tags.set('admin', { name: '管理', description: '管理員相關端點' })
    this.tags.set('analytics', { name: '分析', description: '數據分析相關端點' })
    this.tags.set('community', { name: '社區', description: '社區功能相關端點' })
    this.tags.set('system', { name: '系統', description: '系統相關端點' })
  }

  // 註冊API端點
  registerEndpoint(metadata: ApiEndpointMetadata): void {
    const key = `${metadata.method.toUpperCase()}:${metadata.path}`
    this.endpoints.set(key, metadata)
  }

  // 從路由自動提取端點信息
  extractFromRouter(router: ApiRouter): void {
    const routes = router.getRoutes()

    routes.forEach(route => {
      const metadata = this.extractRouteMetadata(route)
      if (metadata) {
        this.registerEndpoint(metadata)
      }
    })
  }

  // 從路由提取元數據
  private extractRouteMetadata(route: Route): ApiEndpointMetadata | null {
    const path = route.path
    const method = route.method.toUpperCase()

    // 解析路徑參數
    const parameters: ApiParameter[] = []
    const pathParams = path.match(/:(\w+)/g)
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.substring(1)
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${paramName} 參數`
        })
      })
    }

    // 根據路徑和方法生成基本信息
    const summary = this.generateSummary(path, method)
    const description = this.generateDescription(path, method)
    const tags = this.extractTags(path)

    return {
      path,
      method,
      summary,
      description,
      tags,
      parameters,
      responses: this.generateDefaultResponses()
    }
  }

  // 生成摘要
  private generateSummary(path: string, method: string): string {
    const pathSegments = path.split('/').filter(Boolean)
    const resource = pathSegments[pathSegments.length - 1] || 'resource'

    switch (method) {
      case 'GET':
        if (path.includes('/:')) {
          return `獲取${resource}詳情`
        }
        return `獲取${resource}列表`
      case 'POST':
        return `創建${resource}`
      case 'PUT':
      case 'PATCH':
        return `更新${resource}`
      case 'DELETE':
        return `刪除${resource}`
      default:
        return `${method} ${resource}`
    }
  }

  // 生成描述
  private generateDescription(path: string, method: string): string {
    const summary = this.generateSummary(path, method)
    return `${summary}的API端點`
  }

  // 提取標籤
  private extractTags(path: string): string[] {
    if (path.includes('/auth')) return ['auth']
    if (path.includes('/courses')) return ['courses']
    if (path.includes('/jobs')) return ['jobs']
    if (path.includes('/instructors')) return ['instructors']
    if (path.includes('/documents')) return ['documents']
    if (path.includes('/users')) return ['users']
    if (path.includes('/admin')) return ['admin']
    if (path.includes('/analytics')) return ['analytics']
    if (path.includes('/community')) return ['community']
    if (path.includes('/health') || path.includes('/info')) return ['system']
    return ['general']
  }

  // 生成默認響應
  private generateDefaultResponses(): ApiResponses {
    return {
      '200': {
        description: '成功響應',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      },
      '400': {
        description: '請求錯誤',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      },
      '401': {
        description: '未授權',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      },
      '403': {
        description: '禁止訪問',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      },
      '404': {
        description: '資源不存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      },
      '500': {
        description: '服務器錯誤',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      }
    }
  }

  // 生成OpenAPI規範
  generateOpenAPISpec(): OpenAPISpec {
    const paths: ApiPaths = {}

    // 構建路徑
    this.endpoints.forEach((metadata, key) => {
      const [method, path] = key.split(':')

      if (!paths[path]) {
        paths[path] = {}
      }

      paths[path][method.toLowerCase()] = {
        tags: metadata.tags,
        summary: metadata.summary,
        description: metadata.description,
        parameters: metadata.parameters,
        requestBody: metadata.requestBody,
        responses: metadata.responses || this.generateDefaultResponses(),
        security: metadata.security,
        deprecated: metadata.deprecated
      }
    })

    return {
      openapi: '3.0.0',
      info: {
        title: '藥助Next學院 API',
        version: '1.0.0',
        description: '藥局助理轉職教育與就業媒合平台 API 文檔',
        contact: {
          name: '藥助Next學院',
          email: 'support@pharmacy-assistant-academy.com'
        }
      },
      servers: [
        {
          url: 'https://pharmacy-assistant-academy.pages.dev',
          description: '生產環境'
        },
        {
          url: 'https://main.pharmacy-assistant-academy.pages.dev',
          description: '主分支環境'
        }
      ],
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: Array.from(this.tags.values())
    }
  }

  // 生成Swagger UI HTML
  generateSwaggerUI(): string {
    const spec = this.generateOpenAPISpec()

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>藥助Next學院 API 文檔</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2c3e50;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(spec, null, 2)};
      
      SwaggerUIBundle({
        url: '',
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('API文檔加載完成');
        }
      });
    };
  </script>
</body>
</html>`
  }

  // 生成Markdown文檔
  generateMarkdown(): string {
    const spec = this.generateOpenAPISpec()
    let markdown = `# ${spec.info.title}\n\n`
    markdown += `${spec.info.description}\n\n`
    markdown += `**版本**: ${spec.info.version}\n\n`

    if (spec.info.contact) {
      markdown += `**聯繫方式**: ${spec.info.contact.email}\n\n`
    }

    // 服務器信息
    if (spec.servers && spec.servers.length > 0) {
      markdown += `## 服務器\n\n`
      spec.servers.forEach(server => {
        markdown += `- **${server.description}**: \`${server.url}\`\n`
      })
      markdown += '\n'
    }

    // 標籤分組
    const groupedPaths: Record<
      string,
      Array<{ path: string; method: string; operation: ApiOperation }>
    > = {}

    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        const tag = operation.tags?.[0] || 'general'
        if (!groupedPaths[tag]) {
          groupedPaths[tag] = []
        }
        groupedPaths[tag].push({ path, method, operation })
      })
    })

    // 生成各標籤的文檔
    Object.entries(groupedPaths).forEach(([tag, operations]) => {
      const tagInfo = spec.tags?.find(t => t.name === tag)
      markdown += `## ${tagInfo?.description || tag}\n\n`

      operations.forEach(({ path, method, operation }) => {
        markdown += `### ${method.toUpperCase()} ${path}\n\n`
        markdown += `**摘要**: ${operation.summary}\n\n`

        if (operation.description) {
          markdown += `**描述**: ${operation.description}\n\n`
        }

        // 參數
        if (operation.parameters && operation.parameters.length > 0) {
          markdown += `**參數**:\n\n`
          markdown += `| 名稱 | 位置 | 類型 | 必需 | 描述 |\n`
          markdown += `|------|------|------|------|------|\n`

          operation.parameters.forEach(param => {
            markdown += `| ${param.name} | ${param.in} | ${param.schema.type} | ${param.required ? '是' : '否'} | ${param.description || ''} |\n`
          })
          markdown += '\n'
        }

        // 響應
        markdown += `**響應**:\n\n`
        Object.entries(operation.responses).forEach(([statusCode, response]) => {
          markdown += `- **${statusCode}**: ${response.description}\n`
        })
        markdown += '\n'
      })
    })

    return markdown
  }

  // 獲取端點統計
  getStats(): {
    totalEndpoints: number
    endpointsByMethod: Record<string, number>
    endpointsByTag: Record<string, number>
  } {
    const stats = {
      totalEndpoints: this.endpoints.size,
      endpointsByMethod: {} as Record<string, number>,
      endpointsByTag: {} as Record<string, number>
    }

    this.endpoints.forEach(metadata => {
      // 按方法統計
      stats.endpointsByMethod[metadata.method] = (stats.endpointsByMethod[metadata.method] || 0) + 1

      // 按標籤統計
      metadata.tags?.forEach(tag => {
        stats.endpointsByTag[tag] = (stats.endpointsByTag[tag] || 0) + 1
      })
    })

    return stats
  }
}

// 導出單例實例
export const apiDocGenerator = new ApiDocumentationGenerator()

// 導出類型
export type {
  ApiEndpointMetadata,
  ApiParameter,
  ApiRequestBody,
  ApiResponses,
  ApiResponse,
  ApiContent,
  ApiSchema,
  ApiHeader,
  ApiSecurity,
  ApiExamples,
  OpenAPISpec,
  ApiInfo,
  ApiContact,
  ApiLicense,
  ApiServer,
  ApiPaths,
  ApiPathItem,
  ApiOperation,
  ApiComponents,
  ApiSecurityScheme,
  ApiTag
}
