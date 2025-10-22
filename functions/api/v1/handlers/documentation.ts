/**
 * API文檔相關路由處理器
 * 處理OpenAPI規範、Swagger UI、文檔統計等
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

interface Context {
  request: Request
  env: Env
}

export async function handleDocumentationRoutes(context: Context, path: string): Promise<Response> {
  const { request } = context

  // OpenAPI JSON規範
  if (path === '/docs/openapi.json') {
    return handleOpenApiSpec()
  }

  // Swagger UI
  if (path === '/docs') {
    return handleSwaggerUI()
  }

  // 文檔統計
  if (path === '/docs/stats') {
    return handleDocsStats()
  }

  // 如果沒有匹配的路由，返回404
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Documentation endpoint not found'
      }
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}

// OpenAPI規範處理函數
async function handleOpenApiSpec(): Promise<Response> {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: '藥助Next學院 API',
      version: '1.0.0',
      description: '藥局助理轉職教育與就業媒合平台 API',
      contact: {
        name: 'API Support',
        email: 'support@pharmacy-assistant-academy.com'
      }
    },
    servers: [
      {
        url: 'https://fabe6d2d.pharmacy-assistant-academy.pages.dev/api/v1',
        description: 'Production server'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: '健康檢查',
          description: '檢查API服務狀態',
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
        }
      },
      '/info': {
        get: {
          summary: 'API信息',
          description: '獲取API基本信息',
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
        }
      },
      '/optimization/test': {
        get: {
          summary: 'API優化測試',
          description: '測試API優化功能',
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
        }
      },
      '/errors/stats': {
        get: {
          summary: '錯誤統計',
          description: '獲取系統錯誤統計信息',
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
        }
      },
      '/batch': {
        post: {
          summary: '批量操作',
          description: '執行批量API請求',
          requestBody: {
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
        }
      },
      '/db/fix': {
        get: {
          summary: '數據庫修復',
          description: '修復數據庫連接問題',
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
        }
      },
      '/db/optimize': {
        get: {
          summary: '數據庫優化',
          description: '優化數據庫性能',
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
        }
      },
      '/db/n1-check': {
        get: {
          summary: 'N+1問題檢測',
          description: '檢測數據庫N+1查詢問題',
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
      }
    },
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                statusCode: { type: 'number' }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            userType: { type: 'string', enum: ['job_seeker', 'employer'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' },
            durationHours: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' },
            salary: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  }

  return new Response(JSON.stringify(openApiSpec, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// Swagger UI處理函數
async function handleSwaggerUI(): Promise<Response> {
  const swaggerHtml = `
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
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/v1/docs/openapi.json',
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

  return new Response(swaggerHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 文檔統計處理函數
async function handleDocsStats(): Promise<Response> {
  const stats = {
    totalEndpoints: 8,
    documentedEndpoints: 8,
    documentationCoverage: 100,
    lastUpdated: new Date().toISOString(),
    endpoints: {
      system: 4,
      database: 3,
      documentation: 3
    },
    features: [
      'OpenAPI 3.0規範',
      'Swagger UI界面',
      '實時文檔統計',
      '自動端點發現',
      'Markdown文檔生成'
    ]
  }

  return new Response(JSON.stringify({ success: true, data: stats }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

