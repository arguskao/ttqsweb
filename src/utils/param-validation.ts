// 參數驗證工具函數
export function validateRequiredParam(param: string | undefined, paramName: string): string {
  if (!param) {
    throw new Error(`必要參數 '${paramName}' 缺失或未定義`)
  }
  return param
}

export function validateIntParam(param: string | undefined, paramName: string): number {
  if (!param) {
    throw new Error(`必要參數 '${paramName}' 缺失或未定義`)
  }
  const parsed = parseInt(param, 10)
  if (isNaN(parsed)) {
    throw new Error(`參數 '${paramName}' 必須是有效的整數`)
  }
  return parsed
}

export function validateOptionalIntParam(param: string | undefined): number | undefined {
  if (!param) return undefined
  const parsed = parseInt(param, 10)
  return isNaN(parsed) ? undefined : parsed
}
