import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import { authServiceEnhanced } from '@/services/auth-service-enhanced'

// Mock the auth service
vi.mock('@/services/auth-service-enhanced', () => ({
  authServiceEnhanced: {
    login: vi.fn(),
    isAuthenticated: vi.fn(() => false)
  }
}))

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: LoginView }
  ]
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render login form correctly', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('should validate email format', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('invalid-email')
    await emailInput.trigger('blur')

    expect(wrapper.text()).toContain('請輸入有效的電子郵件')
  })

  it('should validate password length', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('123')
    await passwordInput.trigger('blur')

    expect(wrapper.text()).toContain('密碼至少需要8個字符')
  })

  it('should call login service on form submission', async () => {
    const mockLogin = vi.mocked(authServiceEnhanced.login)
    mockLogin.mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        userType: 'job_seeker',
        firstName: 'Test',
        lastName: 'User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isActive: true
      },
      token: 'mock-token'
    })

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should show error message on login failure', async () => {
    const mockLogin = vi.mocked(authServiceEnhanced.login)
    mockLogin.mockRejectedValue(new Error('登入失敗'))

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for error message to appear
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('登入失敗')
  })

  it('should show loading state during login', async () => {
    const mockLogin = vi.mocked(authServiceEnhanced.login)
    // Create a promise that we can control
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve
    })
    mockLogin.mockReturnValue(loginPromise)

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    // Check loading state
    expect(wrapper.find('button[disabled]').exists()).toBe(true)

    // Resolve the login promise
    resolveLogin!({
      user: {
        id: 1,
        email: 'test@example.com',
        userType: 'job_seeker',
        firstName: 'Test',
        lastName: 'User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isActive: true
      },
      token: 'mock-token'
    })

    await wrapper.vm.$nextTick()
  })
})
