/**
 * API文檔類型定義
 * 定義所有API文檔相關的TypeScript接口
 */

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
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  default?: any
  nullable?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  deprecated?: boolean
}

// API標頭定義
export interface ApiHeader {
  description?: string
  required?: boolean
  schema: ApiSchema
  example?: any
}

// API安全定義
export interface ApiSecurity {
  [name: string]: string[]
}

// API示例定義
export interface ApiExamples {
  [name: string]: ApiExample
}

export interface ApiExample {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

// OpenAPI規範定義
export interface OpenAPISpec {
  openapi: string
  info: ApiInfo
  servers?: ApiServer[]
  paths: ApiPaths
  components?: ApiComponents
  security?: ApiSecurity[]
  tags?: ApiTag[]
  externalDocs?: ApiExternalDocs
}

// API信息定義
export interface ApiInfo {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: ApiContact
  license?: ApiLicense
}

// API聯繫信息
export interface ApiContact {
  name?: string
  url?: string
  email?: string
}

// API許可證
export interface ApiLicense {
  name: string
  url?: string
}

// API服務器
export interface ApiServer {
  url: string
  description?: string
  variables?: Record<string, ApiServerVariable>
}

// API服務器變量
export interface ApiServerVariable {
  enum?: string[]
  default: string
  description?: string
}

// API路徑定義
export interface ApiPaths {
  [path: string]: ApiPathItem
}

export interface ApiPathItem {
  summary?: string
  description?: string
  get?: ApiOperation
  put?: ApiOperation
  post?: ApiOperation
  delete?: ApiOperation
  options?: ApiOperation
  head?: ApiOperation
  patch?: ApiOperation
  trace?: ApiOperation
  servers?: ApiServer[]
  parameters?: ApiParameter[]
}

// API操作定義
export interface ApiOperation {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ApiExternalDocs
  operationId?: string
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponses
  callbacks?: Record<string, ApiCallback>
  deprecated?: boolean
  security?: ApiSecurity[]
  servers?: ApiServer[]
}

// API回調定義
export interface ApiCallback {
  [expression: string]: ApiPathItem
}

// API組件定義
export interface ApiComponents {
  schemas?: Record<string, ApiSchema>
  responses?: Record<string, ApiResponse>
  parameters?: Record<string, ApiParameter>
  examples?: Record<string, ApiExample>
  requestBodies?: Record<string, ApiRequestBody>
  headers?: Record<string, ApiHeader>
  securitySchemes?: Record<string, ApiSecurityScheme>
  links?: Record<string, ApiLink>
  callbacks?: Record<string, ApiCallback>
}

// API安全方案
export interface ApiSecurityScheme {
  type: string
  description?: string
  name?: string
  in?: string
  scheme?: string
  bearerFormat?: string
  flows?: ApiOAuthFlows
  openIdConnectUrl?: string
}

// API OAuth流程
export interface ApiOAuthFlows {
  implicit?: ApiOAuthFlow
  password?: ApiOAuthFlow
  clientCredentials?: ApiOAuthFlow
  authorizationCode?: ApiOAuthFlow
}

// API OAuth流程
export interface ApiOAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

// API鏈接
export interface ApiLink {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, any>
  requestBody?: any
  description?: string
  server?: ApiServer
}

// API標籤
export interface ApiTag {
  name: string
  description?: string
  externalDocs?: ApiExternalDocs
}

// API外部文檔
export interface ApiExternalDocs {
  description?: string
  url: string
}

// 文檔生成選項
export interface DocumentationOptions {
  title?: string
  version?: string
  description?: string
  baseUrl?: string
  includeExamples?: boolean
  includeSecurity?: boolean
  customSchemas?: Record<string, ApiSchema>
  customTags?: ApiTag[]
}

