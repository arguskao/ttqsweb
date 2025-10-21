import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CourseCard from '@/components/common/CourseCard.vue'
import type { Course } from '@/types/enhanced'

const mockCourse: Course = {
  id: 1,
  title: '藥學入門',
  description: '基礎藥學知識課程',
  courseType: 'basic',
  durationHours: 40,
  price: 5000,
  instructorId: 1,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  instructorFirstName: '張',
  instructorLastName: '老師',
  instructorEmail: 'teacher@example.com'
}

describe('CourseCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render course information correctly', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    expect(wrapper.find('.title').text()).toBe('藥學入門')
    expect(wrapper.find('.subtitle').text()).toBe('基礎藥學知識課程')
    expect(wrapper.text()).toContain('40 小時')
    expect(wrapper.text()).toContain('NT$ 5,000')
  })

  it('should emit enroll event when enroll button is clicked', async () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    await wrapper.find('[data-testid="enroll-button"]').trigger('click')
    expect(wrapper.emitted('enroll')).toBeTruthy()
    expect(wrapper.emitted('enroll')?.[0]).toEqual([mockCourse])
  })

  it('should display correct course type badge', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    const badge = wrapper.find('.tag')
    expect(badge.text()).toBe('基礎課程')
  })

  it('should show instructor information', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })

    expect(wrapper.text()).toContain('張老師')
  })

  it('should handle inactive courses', () => {
    const inactiveCourse = { ...mockCourse, isActive: false }
    const wrapper = mount(CourseCard, {
      props: { course: inactiveCourse }
    })

    expect(wrapper.find('[data-testid="enroll-button"]').attributes('disabled')).toBeDefined()
  })
})
