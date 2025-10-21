import { ref, computed, watch, readonly, type Ref } from 'vue'
import { z, type ZodSchema } from 'zod'

// 表單驗證狀態
export interface FormValidationState<T> {
  data: Ref<T>
  errors: Ref<Record<string, string>>
  isValid: Ref<boolean>
  isSubmitting: Ref<boolean>
  validate: () => boolean
  validateField: (field: keyof T) => boolean
  reset: () => void
  setError: (field: keyof T, message: string) => void
  clearError: (field: keyof T) => void
}

// 表單驗證 composable
export function useFormValidation<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialData: T
): FormValidationState<T> {
  const data = ref<T>({ ...initialData }) as any
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)

  // 計算是否有效
  const isValid = computed(() => {
    try {
      schema.parse(data.value)
      return Object.keys(errors.value).length === 0
    } catch {
      return false
    }
  })

  // 驗證整個表單
  const validate = (): boolean => {
    try {
      schema.parse(data.value)
      errors.value = {}
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(err => {
          const field = err.path.join('.') as keyof T
          newErrors[field as string] = err.message
        })
        errors.value = newErrors
      }
      return false
    }
  }

  // 驗證單個字段
  const validateField = (field: keyof T): boolean => {
    try {
      // 創建單個字段的 schema
      const fieldSchema = (schema as any).shape?.[field as string] as z.ZodTypeAny | undefined
      if (fieldSchema) {
        fieldSchema.parse(data.value[field])
        clearError(field)
        return true
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(field, error.issues[0]?.message || '驗證失敗')
      }
      return false
    }
  }

  // 設置錯誤
  const setError = (field: keyof T, message: string): void => {
    errors.value[field as string] = message
  }

  // 清除錯誤
  const clearError = (field: keyof T): void => {
    delete errors.value[field as string]
  }

  // 重置表單
  const reset = (): void => {
    data.value = { ...initialData }
    errors.value = {}
    isSubmitting.value = false
  }

  return {
    data,
    errors,
    isValid,
    isSubmitting,
    validate,
    validateField,
    reset,
    setError,
    clearError
  }
}

// 異步表單提交 composable
export function useAsyncForm<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialData: T,
  submitFn: (data: T) => Promise<any>
) {
  const form = useFormValidation(schema, initialData)
  const submitError = ref<string | null>(null)

  const submit = async (): Promise<boolean> => {
    if (!form.validate()) {
      return false
    }

    form.isSubmitting.value = true
    submitError.value = null

    try {
      await submitFn(form.data.value)
      return true
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : '提交失敗'
      return false
    } finally {
      form.isSubmitting.value = false
    }
  }

  return {
    ...form,
    submitError: readonly(submitError),
    submit
  }
}

// 實時驗證 composable
export function useRealtimeValidation<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialData: T,
  debounceMs = 300
) {
  const form = useFormValidation(schema, initialData)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // 監聽數據變化，進行實時驗證
  watch(
    () => form.data.value,
    () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        form.validate()
      }, debounceMs)
    },
    { deep: true }
  )

  return form
}

// 導出常用的驗證規則
export const validationRules = {
  required: (message = '此欄位為必填') => z.string().min(1, message),
  email: (message = '請輸入有效的電子郵件地址') => z.string().email(message),
  minLength: (min: number, message?: string) =>
    z.string().min(min, message || `至少需要${min}個字符`),
  maxLength: (max: number, message?: string) =>
    z.string().max(max, message || `不能超過${max}個字符`),
  phone: (message = '請輸入有效的台灣手機號碼') => z.string().regex(/^09\d{8}$/, message),
  password: (message = '密碼必須包含大小寫字母和數字') =>
    z
      .string()
      .min(8, '密碼至少需要8個字符')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message),
  number: (message = '請輸入有效的數字') => z.coerce.number(message),
  positiveNumber: (message = '請輸入正數') => z.number().positive(message),
  url: (message = '請輸入有效的網址') => z.string().url(message)
}
