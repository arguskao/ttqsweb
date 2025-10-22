/**
 * API文檔預定義模式
 * 包含常用的API響應和數據模式
 */

import type { ApiSchema, ApiTag } from './types'

// 預定義的API標籤
export const defaultTags: ApiTag[] = [
  {
    name: 'Authentication',
    description: '用戶認證相關API'
  },
  {
    name: 'Courses',
    description: '課程管理API'
  },
  {
    name: 'Jobs',
    description: '工作管理API'
  },
  {
    name: 'Users',
    description: '用戶管理API'
  },
  {
    name: 'Instructors',
    description: '講師管理API'
  },
  {
    name: 'Documents',
    description: '文檔管理API'
  },
  {
    name: 'Analytics',
    description: '數據分析API'
  },
  {
    name: 'Community',
    description: '社區功能API'
  },
  {
    name: 'Admin',
    description: '管理員功能API'
  },
  {
    name: 'System',
    description: '系統功能API'
  }
]

// 預定義的API模式
export const defaultSchemas: Record<string, ApiSchema> = {
  // 通用響應模式
  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: '請求是否成功'
      },
      data: {
        type: 'object',
        description: '響應數據'
      },
      error: {
        type: 'object',
        description: '錯誤信息',
        properties: {
          code: {
            type: 'string',
            description: '錯誤代碼'
          },
          message: {
            type: 'string',
            description: '錯誤消息'
          },
          statusCode: {
            type: 'number',
            description: 'HTTP狀態碼'
          }
        }
      },
      meta: {
        type: 'object',
        description: '元數據',
        properties: {
          page: {
            type: 'number',
            description: '當前頁碼'
          },
          limit: {
            type: 'number',
            description: '每頁數量'
          },
          total: {
            type: 'number',
            description: '總數量'
          },
          totalPages: {
            type: 'number',
            description: '總頁數'
          }
        }
      }
    },
    required: ['success']
  },

  // 用戶模式
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '用戶ID'
      },
      email: {
        type: 'string',
        format: 'email',
        description: '用戶郵箱'
      },
      userType: {
        type: 'string',
        enum: ['job_seeker', 'employer'],
        description: '用戶類型'
      },
      firstName: {
        type: 'string',
        description: '名字'
      },
      lastName: {
        type: 'string',
        description: '姓氏'
      },
      phone: {
        type: 'string',
        description: '電話號碼'
      },
      isActive: {
        type: 'boolean',
        description: '是否激活'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '創建時間'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新時間'
      }
    },
    required: ['id', 'email', 'userType']
  },

  // 課程模式
  Course: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '課程ID'
      },
      title: {
        type: 'string',
        description: '課程標題'
      },
      description: {
        type: 'string',
        description: '課程描述'
      },
      durationHours: {
        type: 'number',
        description: '課程時長（小時）'
      },
      price: {
        type: 'number',
        description: '課程價格'
      },
      instructorId: {
        type: 'number',
        description: '講師ID'
      },
      isActive: {
        type: 'boolean',
        description: '是否激活'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '創建時間'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新時間'
      }
    },
    required: ['id', 'title', 'description', 'durationHours']
  },

  // 工作模式
  Job: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '工作ID'
      },
      title: {
        type: 'string',
        description: '工作標題'
      },
      description: {
        type: 'string',
        description: '工作描述'
      },
      company: {
        type: 'string',
        description: '公司名稱'
      },
      location: {
        type: 'string',
        description: '工作地點'
      },
      salary: {
        type: 'number',
        description: '薪資'
      },
      employmentType: {
        type: 'string',
        enum: ['full_time', 'part_time', 'contract', 'internship'],
        description: '工作類型'
      },
      employerId: {
        type: 'number',
        description: '雇主ID'
      },
      isActive: {
        type: 'boolean',
        description: '是否激活'
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        description: '過期時間'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '創建時間'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新時間'
      }
    },
    required: ['id', 'title', 'description', 'company', 'location']
  },

  // 講師模式
  Instructor: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '講師ID'
      },
      userId: {
        type: 'number',
        description: '用戶ID'
      },
      bio: {
        type: 'string',
        description: '個人簡介'
      },
      specialties: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: '專業領域'
      },
      experience: {
        type: 'number',
        description: '工作經驗年數'
      },
      rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: '評分'
      },
      totalStudents: {
        type: 'number',
        description: '總學生數'
      },
      isVerified: {
        type: 'boolean',
        description: '是否驗證'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '創建時間'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新時間'
      }
    },
    required: ['id', 'userId', 'bio']
  },

  // 文檔模式
  Document: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '文檔ID'
      },
      filename: {
        type: 'string',
        description: '文件名'
      },
      originalName: {
        type: 'string',
        description: '原始文件名'
      },
      mimeType: {
        type: 'string',
        description: 'MIME類型'
      },
      size: {
        type: 'number',
        description: '文件大小（字節）'
      },
      userId: {
        type: 'number',
        description: '用戶ID'
      },
      category: {
        type: 'string',
        description: '文檔類別'
      },
      isPublic: {
        type: 'boolean',
        description: '是否公開'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '創建時間'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新時間'
      }
    },
    required: ['id', 'filename', 'originalName', 'mimeType', 'size']
  },

  // 錯誤模式
  Error: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: '錯誤代碼'
      },
      message: {
        type: 'string',
        description: '錯誤消息'
      },
      statusCode: {
        type: 'number',
        description: 'HTTP狀態碼'
      },
      details: {
        type: 'object',
        description: '錯誤詳情'
      }
    },
    required: ['code', 'message', 'statusCode']
  },

  // 分頁模式
  Pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        description: '當前頁碼'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: '每頁數量'
      },
      total: {
        type: 'number',
        description: '總數量'
      },
      totalPages: {
        type: 'number',
        description: '總頁數'
      }
    },
    required: ['page', 'limit', 'total', 'totalPages']
  }
}

// 預定義的響應模式
export const defaultResponses = {
  '200': {
    description: '請求成功',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ApiResponse'
        }
      }
    }
  },
  '400': {
    description: '請求參數錯誤',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error'
        }
      }
    }
  },
  '401': {
    description: '未授權',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error'
        }
      }
    }
  },
  '403': {
    description: '禁止訪問',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error'
        }
      }
    }
  },
  '404': {
    description: '資源不存在',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error'
        }
      }
    }
  },
  '500': {
    description: '服務器內部錯誤',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error'
        }
      }
    }
  }
}

