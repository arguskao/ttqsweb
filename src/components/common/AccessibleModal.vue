<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-accessible"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @keydown="handleKeyDown"
      >
        <div ref="modalContent" class="modal-content" tabindex="-1" @click.stop>
          <div class="modal-header">
            <h2 :id="titleId" class="modal-title">
              {{ title }}
            </h2>
            <button class="modal-close" @click="close" aria-label="關閉對話框">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="description" :id="descriptionId" class="modal-description">
            {{ description }}
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

import { useFocusManagement, useScreenReader } from '@/composables/useAccessibility'

interface Props {
  isOpen: boolean
  title: string
  description?: string
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeOnEscape: true,
  closeOnBackdrop: true
})

const emit = defineEmits<{
  close: []
  'update:isOpen': [value: boolean]
}>()

const modalContent = ref<HTMLElement>()
const { saveFocus, restoreFocus, trapFocusInElement } = useFocusManagement()
const { announce } = useScreenReader()

// 生成唯一的 ID
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `modal-description-${Math.random().toString(36).substr(2, 9)}`)

let cleanupFocusTrap: (() => void) | null = null

const close = () => {
  emit('close')
  emit('update:isOpen', false)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape) {
    close()
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    close()
  }
}

// 監聽模態框開啟/關閉
watch(
  () => props.isOpen,
  async isOpen => {
    if (isOpen) {
      // 保存當前焦點
      saveFocus()

      // 防止背景滾動
      document.body.style.overflow = 'hidden'

      // 等待 DOM 更新後設置焦點
      await nextTick()

      if (modalContent.value) {
        // 設置焦點到模態框
        modalContent.value.focus()

        // 設置焦點陷阱
        cleanupFocusTrap = trapFocusInElement(modalContent.value) || null
      }

      // 通知屏幕閱讀器
      announce(`對話框已開啟: ${props.title}`, 'assertive')
    } else {
      // 恢復背景滾動
      document.body.style.overflow = ''

      // 清理焦點陷阱
      if (cleanupFocusTrap) {
        cleanupFocusTrap()
        cleanupFocusTrap = null
      }

      // 恢復焦點
      restoreFocus()

      // 通知屏幕閱讀器
      announce('對話框已關閉')
    }
  }
)

// 清理
onUnmounted(() => {
  if (cleanupFocusTrap) {
    cleanupFocusTrap()
  }
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
@import '@/assets/accessibility.scss';

.modal-accessible {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 0;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

    &:focus {
      outline: none;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e5e5;

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      color: #333;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      color: #666;
      transition: all 0.3s ease;

      &:hover {
        background: #f5f5f5;
        color: #333;
      }

      &:focus {
        outline: 2px solid #3273dc;
        outline-offset: 2px;
      }
    }
  }

  .modal-description {
    padding: 0 1.5rem;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .modal-body {
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;

    @media (max-width: 768px) {
      flex-direction: column;

      .button {
        width: 100%;
      }
    }
  }
}

// 動畫
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.9) translateY(-20px);
  }
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;

  .modal-content {
    transform: scale(1) translateY(0);
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .modal-accessible {
    .modal-content {
      background: #2a2a2a;
      color: #fff;
    }

    .modal-header {
      border-bottom-color: #444;

      .modal-title {
        color: #fff;
      }

      .modal-close {
        color: #ccc;

        &:hover {
          background: #444;
          color: #fff;
        }
      }
    }

    .modal-description {
      color: #ccc;
    }

    .modal-footer {
      border-top-color: #444;
    }
  }
}

// 高對比度模式
@media (prefers-contrast: high) {
  .modal-accessible {
    .modal-content {
      border: 2px solid #000;
    }

    .modal-header,
    .modal-footer {
      border-color: #000;
    }
  }
}

// 減少動畫偏好
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: none;
  }

  .modal-enter-from,
  .modal-leave-to {
    .modal-content {
      transform: none;
    }
  }
}
</style>
