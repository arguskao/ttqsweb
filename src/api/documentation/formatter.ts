/**
 * API文檔格式化器
 * 將端點元數據格式化為不同格式的文檔
 */

import { defaultSchemas, defaultTags, defaultResponses } from './schemas'
import type {
  ApiEndpointMetadata,
  OpenAPISpec,
  ApiInfo,
  ApiServer,
  ApiTag,
  DocumentationOptions
} from './types'

export class DocumentationFormatter {
  private readonly options: DocumentationOptions

  constructor(options: DocumentationOptions = {}) {
    this.options = {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
      baseUrl: 'https://api.example.com',
      includeExamples: true,
      includeSecurity: true,
      customSchemas: {},
      customTags: [],
      ...options
    }
  }

  /**
   * 生成OpenAPI 3.0規範
   */
  generateOpenAPISpec(endpoints: Map<string, ApiEndpointMetadata>): OpenAPISpec {
    const info: ApiInfo = {
      title: this.options.title!,
      version: this.options.version!,
      description: this.options.description!,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    }

    const servers: ApiServer[] = [
      {
        url: this.options.baseUrl!,
        description: 'Production server'
      }
    ]

    const paths = this.generatePaths(endpoints)
    const components = this.generateComponents()
    const tags = this.generateTags()

    return {
      openapi: '3.0.0',
      info,
      servers,
      paths,
      components,
      tags
    }
  }

  /**
   * 生成路徑定義
   */
  private generatePaths(endpoints: Map<string, ApiEndpointMetadata>) {
    const paths: Record<string, any> = {}

    for (const [key, endpoint] of endpoints) {
      const path = endpoint.path
      const method = endpoint.method.toLowerCase()

      if (!paths[path]) {
        paths[path] = {}
      }

      paths[path][method] = {
        tags: endpoint.tags,
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security,
        deprecated: endpoint.deprecated,
        ...(this.options.includeExamples && { examples: endpoint.examples })
      }
    }

    return paths
  }

  /**
   * 生成組件定義
   */
  private generateComponents() {
    const schemas = {
      ...defaultSchemas,
      ...this.options.customSchemas
    }

    const securitySchemes = this.options.includeSecurity
      ? {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
      : undefined

    return {
      schemas,
      securitySchemes,
      responses: defaultResponses as any
    }
  }

  /**
   * 生成標籤定義
   */
  private generateTags(): ApiTag[] {
    return [...defaultTags, ...this.options.customTags!]
  }

  /**
   * 生成Markdown文檔
   */
  generateMarkdown(endpoints: Map<string, ApiEndpointMetadata>): string {
    let markdown = `# ${this.options.title}\n\n`
    markdown += `${this.options.description}\n\n`
    markdown += `**版本**: ${this.options.version}\n\n`
    markdown += `**基礎URL**: ${this.options.baseUrl}\n\n`

    // 生成目錄
    markdown += '## 目錄\n\n'
    const tags = this.groupEndpointsByTag(endpoints)
    for (const tag of Object.keys(tags)) {
      markdown += `- [${tag}](#${tag.toLowerCase()})\n`
    }
    markdown += '\n'

    // 生成端點文檔
    for (const [tag, tagEndpoints] of Object.entries(tags)) {
      markdown += `## ${tag}\n\n`

      for (const endpoint of tagEndpoints) {
        markdown += this.generateEndpointMarkdown(endpoint)
        markdown += '\n'
      }
    }

    return markdown
  }

  /**
   * 按標籤分組端點
   */
  private groupEndpointsByTag(
    endpoints: Map<string, ApiEndpointMetadata>
  ): Record<string, ApiEndpointMetadata[]> {
    const grouped: Record<string, ApiEndpointMetadata[]> = {}

    for (const endpoint of endpoints.values()) {
      const tags = endpoint.tags || ['Other']
      for (const tag of tags) {
        if (!grouped[tag]) {
          grouped[tag] = []
        }
        grouped[tag].push(endpoint)
      }
    }

    return grouped
  }

  /**
   * 生成單個端點的Markdown
   */
  private generateEndpointMarkdown(endpoint: ApiEndpointMetadata): string {
    let markdown = `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `**摘要**: ${endpoint.summary}\n\n`

    if (endpoint.description) {
      markdown += `**描述**: ${endpoint.description}\n\n`
    }

    // 參數
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += '**參數**:\n\n'
      markdown += '| 名稱 | 位置 | 類型 | 必需 | 描述 |\n'
      markdown += '|------|------|------|------|------|\n'

      for (const param of endpoint.parameters) {
        markdown += `| ${param.name} | ${param.in} | ${param.schema.type} | ${param.required ? '是' : '否'} | ${param.description ?? ''} |\n`
      }
      markdown += '\n'
    }

    // 請求體
    if (endpoint.requestBody) {
      markdown += '**請求體**:\n\n'
      markdown += `- **類型**: ${Object.keys(endpoint.requestBody.content)[0]}\n`
      markdown += `- **必需**: ${endpoint.requestBody.required ? '是' : '否'}\n`
      if (endpoint.requestBody.description) {
        markdown += `- **描述**: ${endpoint.requestBody.description}\n`
      }
      markdown += '\n'
    }

    // 響應
    if (endpoint.responses) {
      markdown += '**響應**:\n\n'
      for (const [statusCode, response] of Object.entries(endpoint.responses)) {
        markdown += `- **${statusCode}**: ${response.description}\n`
      }
      markdown += '\n'
    }

    // 示例
    if (this.options.includeExamples && endpoint.examples) {
      markdown += '**示例**:\n\n'

      if (endpoint.examples.success) {
        markdown += '**成功響應**:\n\n'
        markdown += '```json\n'
        markdown += JSON.stringify(endpoint.examples.success.value, null, 2)
        markdown += '\n```\n\n'
      }

      if (endpoint.examples.error) {
        markdown += '**錯誤響應**:\n\n'
        markdown += '```json\n'
        markdown += JSON.stringify(endpoint.examples.error.value, null, 2)
        markdown += '\n```\n\n'
      }
    }

    return markdown
  }

  /**
   * 生成Swagger UI HTML
   */
  generateSwaggerUI(openApiSpec: OpenAPISpec): string {
    const specJson = JSON.stringify(openApiSpec, null, 2)

    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.options.title}</title>
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
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson};
      const ui = SwaggerUIBundle({
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
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(data) {
          console.error('Swagger UI failed to load:', data);
        }
      });
    };
  </script>
</body>
</html>`
  }

  /**
   * 生成文檔統計
   */
  generateStats(endpoints: Map<string, ApiEndpointMetadata>): any {
    const stats = {
      totalEndpoints: endpoints.size,
      documentedEndpoints: endpoints.size,
      documentationCoverage: 100,
      lastUpdated: new Date().toISOString(),
      endpoints: {} as Record<string, number>,
      features: [
        'OpenAPI 3.0規範',
        'Swagger UI界面',
        '實時文檔統計',
        '自動端點發現',
        'Markdown文檔生成'
      ]
    }

    // 按標籤統計
    for (const endpoint of endpoints.values()) {
      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          stats.endpoints[tag] = (stats.endpoints[tag] ?? 0) + 1
        }
      }
    }

    return stats
  }

  /**
   * 獲取schemas
   */
  getSchemas(): any {
    return defaultSchemas
  }

  /**
   * 獲取tags
   */
  getTags(): any {
    return defaultTags
  }
}
